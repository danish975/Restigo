import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../errors';
import env from '../../config/environment';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'user' | 'provider' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * Middleware: Requires a valid JWT access token.
 * Attaches decoded payload to req.user.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.accessToken;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

    if (!token) {
      throw new UnauthorizedError('Authentication token is required');
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid or expired token'));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware: Optionally parses JWT if present.
 * Does NOT throw if no token — allows anonymous access.
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.accessToken;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

    if (token) {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
      req.user = decoded;
    }
    next();
  } catch {
    // Silently ignore invalid tokens for optional auth
    next();
  }
};

/**
 * Middleware factory: Restricts access to specific roles.
 * Must be used AFTER `authenticate`.
 */
export const authorize = (...roles: Array<'user' | 'provider' | 'admin'>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError(`Role '${req.user.role}' is not authorized to access this resource`));
      return;
    }

    next();
  };
};
