import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { userStore, UserRole } from '../data/users';
import { sendError } from '../utils/response';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

// Augment Express Request to include authenticated user info
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

/**
 * Verifies the JWT token from the Authorization header (Bearer <token>).
 * Attaches decoded payload to req.user on success.
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Access denied. No token provided.', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      sendError(res, 'Token has expired', 401);
      return;
    }
    sendError(res, 'Invalid token', 401);
  }
};

/**
 * Role-based access control.
 * Call after `authenticate` to restrict access to specific roles.
 *
 * @param allowedRoles - Roles permitted to access the route
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(res, 'You do not have permission to perform this action', 403);
      return;
    }

    next();
  };
};
