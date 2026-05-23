"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const auth_model_1 = require("./auth.model");
const errors_1 = require("../../core/errors");
const logger_1 = require("../../core/utils/logger");
const environment_1 = __importDefault(require("../../config/environment"));
class AuthService {
    /**
     * Register a new user with email/password
     */
    async register(data) {
        const existing = await auth_model_1.User.findOne({ email: data.email });
        if (existing) {
            throw new errors_1.ConflictError('An account with this email already exists');
        }
        const user = await auth_model_1.User.create({
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            role: data.role || 'user',
            authProvider: 'local',
        });
        const { accessToken, refreshToken } = await this.generateTokens(user);
        logger_1.logger.info({ userId: user._id }, 'User registered successfully');
        return { user, accessToken, refreshToken };
    }
    /**
     * Login with email/password
     */
    async login(data) {
        const user = await auth_model_1.User.findOne({ email: data.email }).select('+password');
        if (!user) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        if (!user.isActive) {
            throw new errors_1.UnauthorizedError('Account is deactivated');
        }
        const isMatch = await user.comparePassword(data.password);
        if (!isMatch) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const { accessToken, refreshToken } = await this.generateTokens(user);
        user.lastLoginAt = new Date();
        await user.save();
        logger_1.logger.info({ userId: user._id }, 'User logged in');
        return { user, accessToken, refreshToken };
    }
    /**
     * Handle Google OAuth callback
     */
    async googleAuth(profile) {
        let user = await auth_model_1.User.findOne({
            $or: [{ googleId: profile.id }, { email: profile.email }],
        });
        if (user) {
            if (!user.googleId) {
                user.googleId = profile.id;
                user.authProvider = 'google';
                user.isEmailVerified = true;
                await user.save();
            }
        }
        else {
            user = await auth_model_1.User.create({
                email: profile.email,
                firstName: profile.firstName,
                lastName: profile.lastName,
                avatar: profile.avatar,
                googleId: profile.id,
                authProvider: 'google',
                isEmailVerified: true,
            });
        }
        const { accessToken, refreshToken } = await this.generateTokens(user);
        user.lastLoginAt = new Date();
        await user.save();
        return { user, accessToken, refreshToken };
    }
    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(oldRefreshToken) {
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(oldRefreshToken, environment_1.default.JWT_REFRESH_SECRET);
        }
        catch {
            throw new errors_1.UnauthorizedError('Invalid or expired refresh token');
        }
        const user = await auth_model_1.User.findById(decoded.userId).select('+refreshTokens');
        if (!user || !user.refreshTokens.includes(oldRefreshToken)) {
            // Potential token theft — invalidate all refresh tokens
            if (user) {
                user.refreshTokens = [];
                await user.save();
                logger_1.logger.warn({ userId: user._id }, 'Refresh token reuse detected — all sessions invalidated');
            }
            throw new errors_1.UnauthorizedError('Invalid refresh token — all sessions revoked');
        }
        // Rotate: remove old, add new
        user.refreshTokens = user.refreshTokens.filter((t) => t !== oldRefreshToken);
        const { accessToken, refreshToken } = await this.generateTokens(user);
        return { accessToken, refreshToken };
    }
    /**
     * Generate OTP for email/phone verification
     */
    async generateOTP(email) {
        const user = await auth_model_1.User.findOne({ email });
        if (!user)
            throw new errors_1.NotFoundError('User');
        const code = crypto_1.default.randomInt(100000, 999999).toString();
        user.otp = {
            code,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
            attempts: 0,
        };
        await user.save();
        return code;
    }
    /**
     * Verify OTP
     */
    async verifyOTP(email, code, purpose) {
        const user = await auth_model_1.User.findOne({ email });
        if (!user || !user.otp)
            throw new errors_1.BadRequestError('No OTP request found');
        if (user.otp.attempts >= 5) {
            user.otp = undefined;
            await user.save();
            throw new errors_1.BadRequestError('Too many OTP attempts. Please request a new code.');
        }
        if (new Date() > user.otp.expiresAt) {
            throw new errors_1.BadRequestError('OTP has expired');
        }
        if (user.otp.code !== code) {
            user.otp.attempts += 1;
            await user.save();
            throw new errors_1.BadRequestError('Invalid OTP');
        }
        // OTP valid — apply action
        if (purpose === 'verify_email')
            user.isEmailVerified = true;
        if (purpose === 'verify_phone')
            user.isPhoneVerified = true;
        user.otp = undefined;
        await user.save();
        return true;
    }
    /**
     * Logout — remove refresh token
     */
    async logout(userId, refreshToken) {
        await auth_model_1.User.findByIdAndUpdate(userId, {
            $pull: { refreshTokens: refreshToken },
        });
        logger_1.logger.info({ userId }, 'User logged out');
    }
    /**
     * Get user profile
     */
    async getProfile(userId) {
        const user = await auth_model_1.User.findById(userId);
        if (!user)
            throw new errors_1.NotFoundError('User');
        return user;
    }
    // --- Private helpers ---
    async generateTokens(user) {
        const payload = { userId: user._id, email: user.email, role: user.role };
        const accessToken = jsonwebtoken_1.default.sign(payload, environment_1.default.JWT_ACCESS_SECRET, {
            expiresIn: environment_1.default.JWT_ACCESS_EXPIRY,
        });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user._id }, environment_1.default.JWT_REFRESH_SECRET, { expiresIn: environment_1.default.JWT_REFRESH_EXPIRY });
        // Store refresh token (keep max 5 sessions)
        const userDoc = await auth_model_1.User.findById(user._id).select('+refreshTokens');
        if (userDoc) {
            if (userDoc.refreshTokens.length >= 5) {
                userDoc.refreshTokens = userDoc.refreshTokens.slice(-4);
            }
            userDoc.refreshTokens.push(refreshToken);
            await userDoc.save();
        }
        return { accessToken, refreshToken };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map