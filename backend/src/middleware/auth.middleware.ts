import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, isTokenBlacklisted } from '../utils/jwt';
import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';

// Extend Express Request globally — this fixes all route handler type errors
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: UserRole;
      name: string;
    }
    interface Request {
      user?: User;
    }
  }
}

export type AuthRequest = Request;

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }

    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      res.status(401).json({ success: false, error: 'Token revoked' });
      return;
    }

    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, name: true, emailVerified: true },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }
    next();
  };
};
