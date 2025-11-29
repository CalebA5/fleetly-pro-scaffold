import { Router } from 'express';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { users, operators, sessions, customers } from '@shared/schema';
import type { InsertUser, InsertOperator, InsertSession, InsertCustomer } from '@shared/schema';
import { normalizeEmail, normalizeName } from './userVerification';

const router = Router();

function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateUserId(): string {
  return `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

function generateOperatorId(): string {
  return `OP-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

function getGoogleClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }
  
  return new OAuth2Client(clientId, clientSecret);
}

function getRedirectUri(req: any) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}/api/auth/oauth/google/callback`;
}

function getYahooRedirectUri(req: any) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}/api/auth/oauth/yahoo/callback`;
}

async function createOrLoginOAuthUser(email: string, name: string, provider: string, role: string = 'customer') {
  const normalizedEmail = normalizeEmail(email);
  
  let user = await db.query.users.findFirst({
    where: eq(users.emailNormalized, normalizedEmail)
  });
  
  if (!user) {
    const userId = generateUserId();
    const operatorId = role === 'operator' ? generateOperatorId() : null;
    
    const newUser = {
      userId,
      name,
      nameLower: normalizeName(name),
      email,
      emailNormalized: normalizedEmail,
      passwordHash: null,
      role,
      operatorId,
      businessId: null,
    } as any;
    
    const [createdUser] = await db.insert(users).values(newUser).returning();
    user = createdUser;
    
    const customerId = `CUST-${userId.split('-')[1]}`;
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
        operatorTier: null,
        subscribedTiers: [],
        activeTier: null,
        viewTier: null,
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
  }
  
  return user;
}

async function createSession(userId: string) {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  const newSession = {
    sessionId,
    userId,
    expiresAt,
  } as InsertSession;
  
  await db.insert(sessions).values(newSession as any);
  
  return { sessionId, expiresAt };
}

router.get('/google', (req, res) => {
  try {
    const role = (req.query.role as string) || 'customer';
    const client = getGoogleClient();
    const redirectUri = getRedirectUri(req);
    
    const state = Buffer.from(JSON.stringify({ role })).toString('base64');
    
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      redirect_uri: redirectUri,
      state,
    });
    
    res.redirect(authUrl);
  } catch (error: any) {
    console.error('Google OAuth init error:', error);
    res.redirect('/?error=oauth_not_configured');
  }
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.redirect('/?error=oauth_cancelled');
    }
    
    let role = 'customer';
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
        role = stateData.role || 'customer';
      } catch (e) {
        console.error('Failed to parse state:', e);
      }
    }
    
    const client = getGoogleClient();
    const redirectUri = getRedirectUri(req);
    
    const { tokens } = await client.getToken({
      code: code as string,
      redirect_uri: redirectUri,
    });
    
    client.setCredentials(tokens);
    
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.redirect('/?error=oauth_failed');
    }
    
    const user = await createOrLoginOAuthUser(
      payload.email,
      payload.name || payload.email.split('@')[0],
      'google',
      role
    );
    
    const session = await createSession(user.userId);
    
    res.cookie('sessionId', session.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    
    if (role === 'operator' && user.role === 'operator') {
      res.redirect('/drive-earn');
    } else {
      res.redirect('/');
    }
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    res.redirect('/?error=oauth_failed');
  }
});

router.get('/yahoo', (req, res) => {
  try {
    const clientId = process.env.YAHOO_CLIENT_ID;
    
    if (!clientId) {
      return res.redirect('/?error=oauth_not_configured');
    }
    
    const role = (req.query.role as string) || 'customer';
    const redirectUri = getYahooRedirectUri(req);
    const state = Buffer.from(JSON.stringify({ role })).toString('base64');
    
    const authUrl = new URL('https://api.login.yahoo.com/oauth2/request_auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('state', state);
    
    res.redirect(authUrl.toString());
  } catch (error: any) {
    console.error('Yahoo OAuth init error:', error);
    res.redirect('/?error=oauth_not_configured');
  }
});

router.get('/yahoo/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.redirect('/?error=oauth_cancelled');
    }
    
    let role = 'customer';
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
        role = stateData.role || 'customer';
      } catch (e) {
        console.error('Failed to parse state:', e);
      }
    }
    
    const clientId = process.env.YAHOO_CLIENT_ID;
    const clientSecret = process.env.YAHOO_CLIENT_SECRET;
    const redirectUri = getYahooRedirectUri(req);
    
    if (!clientId || !clientSecret) {
      return res.redirect('/?error=oauth_not_configured');
    }
    
    const tokenResponse = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri,
      }),
    });
    
    const tokens = await tokenResponse.json() as { access_token?: string; error?: string };
    
    if (!tokens.access_token) {
      console.error('Yahoo token error:', tokens);
      return res.redirect('/?error=oauth_failed');
    }
    
    const userInfoResponse = await fetch('https://api.login.yahoo.com/openid/v1/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });
    
    const userInfo = await userInfoResponse.json() as { email?: string; name?: string };
    
    if (!userInfo.email) {
      return res.redirect('/?error=oauth_failed');
    }
    
    const user = await createOrLoginOAuthUser(
      userInfo.email,
      userInfo.name || userInfo.email.split('@')[0],
      'yahoo',
      role
    );
    
    const session = await createSession(user.userId);
    
    res.cookie('sessionId', session.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    
    if (role === 'operator' && user.role === 'operator') {
      res.redirect('/drive-earn');
    } else {
      res.redirect('/');
    }
  } catch (error: any) {
    console.error('Yahoo OAuth callback error:', error);
    res.redirect('/?error=oauth_failed');
  }
});

router.get('/status', (req, res) => {
  const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const yahooConfigured = !!(process.env.YAHOO_CLIENT_ID && process.env.YAHOO_CLIENT_SECRET);
  
  res.json({
    google: googleConfigured,
    yahoo: yahooConfigured,
  });
});

export default router;
