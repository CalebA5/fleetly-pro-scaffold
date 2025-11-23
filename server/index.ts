import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { MemStorage } from "./storage";
import { createServer } from "http";
import authRouter from "./auth";
import { startWeatherSyncJob } from "./jobs/weatherSync";
import { db } from "./db";
import { sessions } from "@shared/schema";
import { eq, gt } from "drizzle-orm";

// Extend Express Request to include session
declare global {
  namespace Express {
    interface Request {
      session?: {
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

// Session middleware - populates req.session from database
app.use(async (req, res, next) => {
  const sessionId = req.cookies.sessionId;
  
  if (sessionId) {
    try {
      // Query session from database
      const session = await db.query.sessions.findFirst({
        where: eq(sessions.sessionId, sessionId),
      });
      
      // Check if session exists and hasn't expired
      if (session && new Date(session.expiresAt) > new Date()) {
        req.session = {
          userId: session.userId,
          sessionId: session.sessionId,
        };
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
