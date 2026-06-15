import { Request, Response, NextFunction } from 'express';
export interface AuthPayload {
    userId: string;
    email: string;
    role: 'user' | 'provider' | 'admin';
}
/**
 * Middleware: Requires a valid JWT access token.
 * Attaches decoded payload to req.user.
 */
export declare const authenticate: (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Middleware: Optionally parses JWT if present.
 * Does NOT throw if no token — allows anonymous access.
 */
export declare const optionalAuth: (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Middleware factory: Restricts access to specific roles.
 * Must be used AFTER `authenticate`.
 */
export declare const authorize: (...roles: Array<"user" | "provider" | "admin">) => (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map