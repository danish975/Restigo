"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = require("./auth.service");
const validate_1 = require("../../core/middleware/validate");
const auth_1 = require("../../core/middleware/auth");
const auth_dto_1 = require("./auth.dto");
const http_status_codes_1 = require("http-status-codes");
const passport_1 = __importDefault(require("../../config/passport"));
const environment_1 = __importDefault(require("../../config/environment"));
const router = (0, express_1.Router)();
// POST /auth/register
router.post('/register', (0, validate_1.validate)(auth_dto_1.registerDto), async (req, res, next) => {
    try {
        const result = await auth_service_1.authService.register(req.body);
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            data: { user: result.user, accessToken: result.accessToken },
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /auth/login
router.post('/login', (0, validate_1.validate)(auth_dto_1.loginDto), async (req, res, next) => {
    try {
        const result = await auth_service_1.authService.login(req.body);
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: { user: result.user, accessToken: result.accessToken },
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /auth/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken || req.body.refreshToken;
        if (!token) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ success: false, error: { message: 'Refresh token required' } });
            return;
        }
        const result = await auth_service_1.authService.refreshAccessToken(token);
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: { accessToken: result.accessToken } });
    }
    catch (error) {
        next(error);
    }
});
// POST /auth/otp/request
router.post('/otp/request', (0, validate_1.validate)(auth_dto_1.otpRequestDto), async (req, res, next) => {
    try {
        const code = await auth_service_1.authService.generateOTP(req.body.email);
        // In production, send via email/SMS — here we just confirm
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: 'OTP sent successfully',
            ...(process.env.NODE_ENV !== 'production' && { _devOtp: code }),
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /auth/otp/verify
router.post('/otp/verify', (0, validate_1.validate)(auth_dto_1.otpVerifyDto), async (req, res, next) => {
    try {
        await auth_service_1.authService.verifyOTP(req.body.email, req.body.code, req.body.purpose);
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: 'Verification successful' });
    }
    catch (error) {
        next(error);
    }
});
// POST /auth/logout
router.post('/logout', auth_1.authenticate, async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken || req.body.refreshToken;
        await auth_service_1.authService.logout(req.user.userId, token);
        res.clearCookie('refreshToken');
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: 'Logged out' });
    }
    catch (error) {
        next(error);
    }
});
// GET /auth/me
router.get('/me', auth_1.authenticate, async (req, res, next) => {
    try {
        const user = await auth_service_1.authService.getProfile(req.user.userId);
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: { user } });
    }
    catch (error) {
        next(error);
    }
});
// ─── Google OAuth Routes ───
// GET /auth/google (Initiates Google OAuth)
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
// GET /auth/google/callback
router.get('/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: `${environment_1.default.FRONTEND_URL}/login?error=auth_failed` }), (req, res) => {
    // The user is authenticated and tokens are attached to req.user via passport config
    const result = req.user;
    // Set refresh token in cookie
    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // Send access token back to frontend via query param (or render a script to pass it safely)
    // Sending it in the URL fragment is safer for SPA redirects
    res.redirect(`${environment_1.default.FRONTEND_URL}/auth/callback?token=${result.accessToken}`);
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map