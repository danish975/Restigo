"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceUnavailableError = exports.ValidationError = exports.PaymentRequiredError = exports.TooManyRequestsError = exports.ResourceLockedError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.NotFoundError = exports.AppError = void 0;
const http_status_codes_1 = require("http-status-codes");
class AppError extends Error {
    statusCode;
    isOperational;
    code;
    constructor(message, statusCode = http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, code = 'INTERNAL_ERROR', isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, http_status_codes_1.StatusCodes.NOT_FOUND, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(message, http_status_codes_1.StatusCodes.BAD_REQUEST, 'BAD_REQUEST');
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED');
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, http_status_codes_1.StatusCodes.FORBIDDEN, 'FORBIDDEN');
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, http_status_codes_1.StatusCodes.CONFLICT, 'CONFLICT');
    }
}
exports.ConflictError = ConflictError;
class ResourceLockedError extends AppError {
    constructor(message = 'Resource is currently locked') {
        super(message, 423, 'RESOURCE_LOCKED');
    }
}
exports.ResourceLockedError = ResourceLockedError;
class TooManyRequestsError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, http_status_codes_1.StatusCodes.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED');
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
class PaymentRequiredError extends AppError {
    constructor(message = 'Payment required') {
        super(message, http_status_codes_1.StatusCodes.PAYMENT_REQUIRED, 'PAYMENT_REQUIRED');
    }
}
exports.PaymentRequiredError = PaymentRequiredError;
class ValidationError extends AppError {
    errors;
    constructor(errors) {
        super('Validation failed', http_status_codes_1.StatusCodes.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR');
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
class ServiceUnavailableError extends AppError {
    constructor(service = 'Service') {
        super(`${service} is temporarily unavailable`, http_status_codes_1.StatusCodes.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
//# sourceMappingURL=AppError.js.map