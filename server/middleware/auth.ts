import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users, operators } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Authentication Middleware
 * 
 * This middleware provides secure session validation and role-based access control.
 * Created as part of operator verification security hardening.
 * 
 * FUTURE WORK: Gradually migrate existing routes to use this middleware
 * for consistent authentication across the entire application.
 */

export interface AuthenticatedRequest extends Request {
  userId: string;
  user?: {
    id: number;
    userId: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * Require authenticated session
 * Validates that the user has a valid session and the user exists in the database
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check for session userId
    const userId = req.sessionData?.userId || req.session?.userId;

    if (!userId) {
      res.status(401).json({ 
        message: "Authentication required",
        code: "NO_SESSION" 
      });
      return;
    }

    // Validate user exists in database
    const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);

    if (!user) {
      res.status(401).json({ 
        message: "Invalid session - user not found",
        code: "INVALID_USER" 
      });
      return;
    }

    // Attach validated user data to request
    (req as AuthenticatedRequest).userId = userId;
    (req as AuthenticatedRequest).user = {
      id: user.id,
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
}

/**
 * Require specific role(s)
 * Must be used after requireAuth
 */
export function requireRole(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json({ 
        message: "Authentication required",
        code: "NO_AUTH" 
      });
      return;
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      res.status(403).json({ 
        message: "Insufficient permissions",
        code: "FORBIDDEN",
        required: allowedRoles,
        actual: authReq.user.role,
      });
      return;
    }

    next();
  };
}

/**
 * Require operator profile for specific tier
 * Note: This checks operator applications rather than operator records
 * since operator-user linking uses the applications system
 */
export function requireOperatorApplication(tier?: "manual" | "equipped" | "professional") {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.userId) {
      res.status(401).json({ 
        message: "Authentication required",
        code: "NO_AUTH" 
      });
      return;
    }

    // For operator endpoints, we verify via applications
    // The full operator profile validation happens in the route handlers
    next();
  };
}

/**
 * Rate limiting helper for preventing brute force attacks
 * Stores attempt counts in memory (use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(maxAttempts: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();
    const record = rateLimitStore.get(key);

    // Clean up expired records
    if (record && now > record.resetAt) {
      rateLimitStore.delete(key);
    }

    const current = rateLimitStore.get(key);

    if (!current) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (current.count >= maxAttempts) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000);
      res.status(429).json({ 
        message: "Too many requests. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter,
      });
      return;
    }

    current.count++;
    next();
  };
}
