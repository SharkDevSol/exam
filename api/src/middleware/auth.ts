import { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../utils/auth';

export enum Role {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

/**
 * Middleware to require authentication via session (for admin/teacher)
 */
export function requireSession(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId || !req.session.role) {
    return res.status(401).json({ error: 'Unauthorized - Please log in' });
  }
  
  req.user = {
    userId: req.session.userId,
    role: req.session.role,
  };
  
  next();
}

/**
 * Middleware to require JWT authentication (for students)
 */
export function requireJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - Token required' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = verifyJWT(token);
    req.user = {
      userId: payload.userId,
      role: payload.role,
    };
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid token';
    return res.status(401).json({ error: `Unauthorized - ${message}` });
  }
}

/**
 * Middleware to require specific role(s)
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized - Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role as Role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }
    
    next();
  };
}

/**
 * Combined middleware for admin routes (session + role check)
 */
export const requireAdmin = [requireSession, requireRole(Role.ADMIN)];

/**
 * Combined middleware for teacher routes (session + role check)
 */
export const requireTeacher = [requireSession, requireRole(Role.TEACHER)];

/**
 * Combined middleware for student routes (JWT + role check)
 */
export const requireStudent = [requireJWT, requireRole(Role.STUDENT)];
