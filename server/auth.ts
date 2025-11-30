import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { eq, and, gt } from 'drizzle-orm';
import { db } from './db';
import { users, operators, sessions, customers } from '@shared/schema';
import type { InsertUser, InsertOperator, InsertSession, InsertCustomer } from '@shared/schema';
import { verifyNewUser, checkEmailDuplicate, checkNameDuplicate, normalizeEmail, normalizeName } from './userVerification';
import oauthRouter from './oauth';

const router = Router();

router.use('/oauth', oauthRouter);

// Helper to generate session ID
function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Helper to generate user ID
function generateUserId(): string {
  return `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

// Helper to generate operator ID
function generateOperatorId(): string {
  return `OP-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

// POST /api/auth/verify-email - Check if email is available (real-time validation)
router.post('/verify-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const result = await checkEmailDuplicate(email);
    
    res.json({
      isAvailable: !result.isDuplicate,
      message: result.message
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// POST /api/auth/verify-name - Check if name is available (real-time validation)
router.post('/verify-name', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const result = await checkNameDuplicate(name, email || '');
    
    res.json({
      isAvailable: !result.isDuplicate,
      message: result.message
    });
  } catch (error) {
    console.error('Name verification error:', error);
    res.status(500).json({ error: 'Failed to verify name' });
  }
});

// POST /api/auth/signup - Create new account
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (role !== 'customer' && role !== 'operator') {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Comprehensive duplicate check (email + name similarity)
    const verification = await verifyNewUser(name, email);
    
    if (!verification.isValid) {
      return res.status(409).json({ 
        error: 'Account verification failed',
        details: verification.errors
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user ID
    const userId = generateUserId();
    
    // Create operator ID if role is operator
    const operatorId = role === 'operator' ? generateOperatorId() : null;

    // Create user with normalized fields for fast duplicate detection
    const newUser = {
      userId,
      name,
      nameLower: normalizeName(name),
      email,
      emailNormalized: normalizeEmail(email),
      passwordHash,
      role,
      operatorId,
      businessId: null,
    } as any;

    const [createdUser] = await db.insert(users).values(newUser).returning();

    // Create customer record (all users can request services)
    const customerId = `CUST-${userId.split('-')[1]}`; // Use timestamp from userId
    const newCustomer = {
      customerId,
      name,
      email,
      phone: '',
      address: null,
      city: null,
      state: null,
      zipCode: null,
      photo: null,
    } as InsertCustomer;

    await db.insert(customers).values(newCustomer as any);

    // If operator, create operator profile
    if (role === 'operator' && operatorId) {
      const newOperator = {
        operatorId,
        name,
        email,
        phone: '',
        rating: '0.0',
        totalJobs: 0,
        services: [],
        vehicle: 'Not set',
        licensePlate: 'Not set',
        latitude: '0',
        longitude: '0',
        address: 'Not set',
        isOnline: 0,
        hourlyRate: '0.00',
        availability: 'available',
        photo: null,
        operatorTier: null, // No tier by default - user must select one
        subscribedTiers: [], // Empty - user can choose which tiers to add
        activeTier: null, // Null by default - only set when operator goes online
        viewTier: null, // No view tier until user subscribes to a tier
        isCertified: 0,
        businessLicense: null,
        homeLatitude: null,
        homeLongitude: null,
        operatingRadius: '5.00',
        businessId: null,
        businessName: null,
        driverName: null,
      } as InsertOperator;

      await db.insert(operators).values(newOperator as any);
    }

    // Create session
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const newSession = {
      sessionId,
      userId: createdUser.userId,
      expiresAt,
    } as InsertSession;

    await db.insert(sessions).values(newSession as any);

    // Set session cookie
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Fetch operator data if applicable
    let operatorData = null;
    if (role === 'operator' && operatorId) {
      operatorData = await db.query.operators.findFirst({
        where: eq(operators.operatorId, operatorId)
      });
    }

    // Return user data (without password hash)
    res.json({
      id: customerId, // Use customer ID as the main ID for consistency
      userId: createdUser.userId,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role,
      operatorId: createdUser.operatorId,
      businessId: createdUser.businessId,
      customerId: customerId,
      operatorProfileComplete: role === 'operator' ? false : undefined,
      operatorTier: operatorData?.operatorTier,
      subscribedTiers: operatorData?.subscribedTiers,
      activeTier: operatorData?.activeTier,
      viewTier: operatorData?.viewTier,
      operatorTierProfiles: operatorData?.operatorTierProfiles,
      isAdmin: (createdUser as any).isAdmin,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /api/auth/signin - Sign in existing user
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    // Find user by normalized email for case-insensitive login
    const user = await db.query.users.findFirst({
      where: eq(users.emailNormalized, normalizeEmail(email))
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create new session
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const newSession = {
      sessionId,
      userId: user.userId,
      expiresAt,
    } as InsertSession;

    await db.insert(sessions).values(newSession as any);

    // Set session cookie
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Create customer record if it doesn't exist (for existing users)
    const customerId = `CUST-${user.userId.split('-')[1]}`;
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.customerId, customerId)
    });

    if (!existingCustomer) {
      const newCustomer = {
        customerId,
        name: user.name,
        email: user.email,
        phone: '',
        address: null,
        city: null,
        state: null,
        zipCode: null,
        photo: null,
      } as InsertCustomer;

      await db.insert(customers).values(newCustomer as any);
    }

    // Fetch operator data if applicable
    let operatorData = null;
    if (user.role === 'operator' && user.operatorId) {
      operatorData = await db.query.operators.findFirst({
        where: eq(operators.operatorId, user.operatorId)
      });
    }

    // Return user data (without password hash)
    res.json({
      id: customerId, // Use customer ID as the main ID for consistency
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      operatorId: user.operatorId,
      businessId: user.businessId,
      customerId: customerId,
      operatorProfileComplete: user.role === 'operator',
      operatorTier: operatorData?.operatorTier,
      subscribedTiers: operatorData?.subscribedTiers,
      activeTier: operatorData?.activeTier,
      viewTier: operatorData?.viewTier,
      operatorTierProfiles: operatorData?.operatorTierProfiles,
      isAdmin: (user as any).isAdmin,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// GET /api/auth/session - Get current session
router.get('/session', async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;

    if (!sessionId) {
      return res.status(401).json({ error: 'No session' });
    }

    // Find session
    const session = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.sessionId, sessionId),
        gt(sessions.expiresAt, new Date())
      )
    });

    if (!session) {
      res.clearCookie('sessionId');
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.userId, session.userId)
    });

    if (!user) {
      await db.delete(sessions).where(eq(sessions.sessionId, sessionId));
      res.clearCookie('sessionId');
      return res.status(401).json({ error: 'User not found' });
    }

    // Create customer record if it doesn't exist (for existing users)
    const customerId = `CUST-${user.userId.split('-')[1]}`;
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.customerId, customerId)
    });

    if (!existingCustomer) {
      const newCustomer = {
        customerId,
        name: user.name,
        email: user.email,
        phone: '',
        address: null,
        city: null,
        state: null,
        zipCode: null,
        photo: null,
      } as InsertCustomer;

      await db.insert(customers).values(newCustomer as any);
    }

    // Fetch operator data if applicable
    let operatorData = null;
    if (user.role === 'operator' && user.operatorId) {
      operatorData = await db.query.operators.findFirst({
        where: eq(operators.operatorId, user.operatorId)
      });
    }

    // Return user data (without password hash)
    res.json({
      id: customerId, // Use customer ID as the main ID for consistency
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      operatorId: user.operatorId,
      businessId: user.businessId,
      customerId: customerId,
      operatorProfileComplete: user.role === 'operator',
      operatorTier: operatorData?.operatorTier,
      subscribedTiers: operatorData?.subscribedTiers,
      activeTier: operatorData?.activeTier,
      viewTier: operatorData?.viewTier,
      operatorTierProfiles: operatorData?.operatorTierProfiles,
      isAdmin: (user as any).isAdmin,
    });
  } catch (error) {
    console.error('Session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// POST /api/auth/signout - Sign out current user
router.post('/signout', async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;

    if (sessionId) {
      await db.delete(sessions).where(eq(sessions.sessionId, sessionId));
    }

    res.clearCookie('sessionId');
    res.json({ success: true });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({ error: 'Failed to sign out' });
  }
});

// POST /api/auth/change-password - Change user password
router.post('/change-password', async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    
    if (!sessionId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.sessionId, sessionId)
    });
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    
    const user = await db.query.users.findFirst({
      where: eq(users.userId, session.userId)
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    await db.update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.userId, session.userId));
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
