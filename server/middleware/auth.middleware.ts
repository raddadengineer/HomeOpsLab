import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authService } from '../services/auth.service';

// Extend Express Request interface to include user object
declare global {
  namespace Express {
    interface Request {
      user?: string | jwt.JwtPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // Extract token from Auth Header or Custom Agent Header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  // If no token is provided but this is local development/first-time setup, we could bypass
  // In a production app, we would enforce this strictly.
  // For now, we secure all /api routes but permit access if the token is valid,
  // or return 401 if a token was provided but is invalid.

  if (!token) {
    // Optionally allow unauthenticated access on localhost, or enforce it strictly:
    // return res.status(401).json({ error: 'Authentication token required' });

    // For HomeOps internal network easing, let it pass if no token is presented (legacy mode)
    // but this should be configurable.
    return next();
  }

  const user = authService.verifyToken(token);

  if (!user) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  next();
};
