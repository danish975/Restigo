"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpVerifyDto = exports.otpRequestDto = exports.refreshTokenDto = exports.loginDto = exports.registerDto = void 0;
const zod_1 = require("zod");
exports.registerDto = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain an uppercase letter')
        .regex(/[0-9]/, 'Must contain a number'),
    firstName: zod_1.z.string().min(1).max(50),
    lastName: zod_1.z.string().min(1).max(50),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['user', 'provider']).default('user'),
});
exports.loginDto = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.refreshTokenDto = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
exports.otpRequestDto = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    purpose: zod_1.z.enum(['verify_email', 'verify_phone', 'reset_password']),
});
exports.otpVerifyDto = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    code: zod_1.z.string().length(6, 'OTP must be 6 digits'),
    purpose: zod_1.z.enum(['verify_email', 'verify_phone', 'reset_password']),
});
//# sourceMappingURL=auth.dto.js.map