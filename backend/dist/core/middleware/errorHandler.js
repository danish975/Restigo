"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.globalErrorHandler = void 0;
const errors_1 = require("../errors");
const logger_1 = require("../utils/logger");
const environment_1 = __importDefault(require("../../config/environment"));
const globalErrorHandler = (err, _req, res, _next) => {
    // Log the error
    if (err instanceof errors_1.AppError && err.isOperational) {
        logger_1.logger.warn({ err, statusCode: err.statusCode, code: err.code }, err.message);
    }
    else {
        logger_1.logger.error({ err }, 'Unhandled error');
    }
    // Handle known operational errors
    if (err instanceof errors_1.ValidationError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                errors: err.errors,
            },
        });
        return;
    }
    if (err instanceof errors_1.AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
            },
        });
        return;
    }
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        res.status(422).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Database validation failed',
                errors: err.message,
            },
        });
        return;
    }
    // Handle Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        res.status(409).json({
            success: false,
            error: {
                code: 'DUPLICATE_KEY',
                message: `A record with this ${field} already exists`,
            },
        });
        return;
    }
    // Handle Mongoose cast error (invalid ObjectId etc.)
    if (err.name === 'CastError') {
        res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_ID',
                message: 'Invalid resource identifier',
            },
        });
        return;
    }
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid authentication token',
            },
        });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            error: {
                code: 'TOKEN_EXPIRED',
                message: 'Authentication token has expired',
            },
        });
        return;
    }
    // Unknown errors — don't leak internal details in production
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: environment_1.default.NODE_ENV === 'production'
                ? 'An unexpected error occurred'
                : err.message,
            ...(environment_1.default.NODE_ENV !== 'production' && { stack: err.stack }),
        },
    });
};
exports.globalErrorHandler = globalErrorHandler;
// 404 handler for unmatched routes
const notFoundHandler = (req, _res, next) => {
    next(new errors_1.AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND'));
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorHandler.js.map