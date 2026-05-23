"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.optionalAuth = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../errors");
const environment_1 = __importDefault(require("../../config/environment"));
/**
 * Middleware: Requires a valid JWT access token.
 * Attaches decoded payload to req.user.
 */
const authenticate = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const cookieToken = req.cookies?.accessToken;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;
        if (!token) {
            throw new errors_1.UnauthorizedError('Authentication token is required');
        }
        const decoded = jsonwebtoken_1.default.verify(token, environment_1.default.JWT_ACCESS_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new errors_1.UnauthorizedError('Invalid or expired token'));
        }
        else {
            next(error);
        }
    }
};
exports.authenticate = authenticate;
/**
 * Middleware: Optionally parses JWT if present.
 * Does NOT throw if no token — allows anonymous access.
 */
const optionalAuth = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const cookieToken = req.cookies?.accessToken;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, environment_1.default.JWT_ACCESS_SECRET);
            req.user = decoded;
        }
        next();
    }
    catch {
        // Silently ignore invalid tokens for optional auth
        next();
    }
};
exports.optionalAuth = optionalAuth;
/**
 * Middleware factory: Restricts access to specific roles.
 * Must be used AFTER `authenticate`.
 */
const authorize = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            next(new errors_1.UnauthorizedError('Authentication required'));
            return;
        }
        if (!roles.includes(req.user.role)) {
            next(new errors_1.ForbiddenError(`Role '${req.user.role}' is not authorized to access this resource`));
            return;
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.js.map