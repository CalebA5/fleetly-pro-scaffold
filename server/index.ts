import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { MemStorage } from "./storage";
import { createServer } from "http";
import authRouter from "./auth";
import { startWeatherSyncJob } from "./jobs/weatherSync";
import { db } from "./db";
import { sessions, users, operators } from "@shared/schema";
import { eq } from "drizzle-orm";
import pg from "pg";

// User type for session
interface SessionUser {
  userId: string;
  id: string;
  email: string;
  name: string;
  role: string;
  operatorId?: string | null;
  operatorTier?: string | null;
  subscribedTiers?: string[];
  viewTier?: string | null;
  operatorProfileComplete?: boolean;
  businessId?: string | null;
}

// Extend Express Session to include userId and user
declare module "express-session" {
  interface SessionData {
    userId: string;
    user?: SessionUser;
  }
}

// Extend Express Request to include custom session for our auth flow
declare global {
  namespace Express {
    interface Request {
      sessionData?: {
        userId: string;
        sessionId: string;
      };
    }
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Initialize express-session middleware so req.session exists
// We use a simple memory store since our custom middleware handles actual session data
app.use(session({
  secret: process.env.SESSION_SECRET || 'fleetly-session-secret-dev',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Custom session middleware that reads from our custom sessions table
// This maintains compatibility with existing auth system
app.use(async (req, res, next) => {
  const sessionId = req.cookies.sessionId;
  
  if (sessionId) {
    try {
      const dbSession = await db.query.sessions.findFirst({
        where: eq(sessions.sessionId, sessionId),
      });
      
      if (dbSession && new Date(dbSession.expiresAt) > new Date()) {
        // Populate req.sessionData for our existing auth checks
        req.sessionData = {
          userId: dbSession.userId,
          sessionId: dbSession.sessionId,
        };
        
        // Fetch the user data to populate req.session.user
        const user = await db.query.users.findFirst({
          where: eq(users.userId, dbSession.userId),
        });
        
        if (user) {
          // Build base session user object
          const sessionUser: SessionUser = {
            userId: user.userId,
            id: user.operatorId || user.userId,
            email: user.email,
            name: user.name,
            role: user.role,
            operatorId: user.operatorId,
            businessId: user.businessId,
          };
          
          // If user has an operatorId, fetch operator data for tier info
          if (user.operatorId) {
            const operator = await db.query.operators.findFirst({
              where: eq(operators.operatorId, user.operatorId),
            });
            
            if (operator) {
              sessionUser.operatorTier = operator.operatorTier;
              sessionUser.subscribedTiers = operator.subscribedTiers || [];
              sessionUser.viewTier = operator.viewTier;
              sessionUser.operatorProfileComplete = true;
            }
          }
          
          // Set on req.session for routes that expect req.session.user
          req.session.userId = dbSession.userId;
          (req.session as any).user = sessionUser;
        }
      }
    } catch (error) {
      console.error("Session lookup error:", error);
    }
  }
  
  next();
});

const storage = new MemStorage();

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Auth routes (database-backed)
app.use('/api/auth', authRouter);

// Other API routes (memory-backed for now)
const router = registerRoutes(storage);
app.use(router);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error("Error:", err);
  res.status(status).json({ message });
});

const server = createServer(app);

if (process.env.NODE_ENV === "production") {
  serveStatic(app);
} else {
  setupVite(app, server);
}

const PORT = 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start automated weather alert sync job
  startWeatherSyncJob();
});
