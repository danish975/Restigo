import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from './auth.model';
import { UnauthorizedError, BadRequestError, ConflictError, NotFoundError } from '../../core/errors';
import { logger } from '../../core/utils/logger';
import env from '../../config/environment';
import type { RegisterDto, LoginDto } from './auth.dto';

export class AuthService {
  /**
   * Register a new user with email/password
   */
  async register(data: RegisterDto): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const user = await User.create({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role || 'user',
      authProvider: 'local',
    });

    const { accessToken, refreshToken } = await this.generateTokens(user);
    logger.info({ userId: user._id }, 'User registered successfully');

    return { user, accessToken, refreshToken };
  }

  /**
   * Login with email/password
   */
  async login(data: LoginDto): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const user = await User.findOne({ email: data.email }).select('+password');
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);

    user.lastLoginAt = new Date();
    await user.save();

    logger.info({ userId: user._id }, 'User logged in');
    return { user, accessToken, refreshToken };
  }

  /**
   * Handle Google OAuth callback
   */
  async googleAuth(profile: {
    id: string; email: string; firstName: string; lastName: string; avatar?: string;
  }): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    let user = await User.findOne({
      $or: [{ googleId: profile.id }, { email: profile.email }],
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = profile.id;
        user.authProvider = 'google';
        user.isEmailVerified = true;
        await user.save();
      }
    } else {
      user = await User.create({
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
  async refreshAccessToken(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let decoded: any;
    try {
      decoded = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.userId).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(oldRefreshToken)) {
      // Potential token theft — invalidate all refresh tokens
      if (user) {
        user.refreshTokens = [];
        await user.save();
        logger.warn({ userId: user._id }, 'Refresh token reuse detected — all sessions invalidated');
      }
      throw new UnauthorizedError('Invalid refresh token — all sessions revoked');
    }

    // Rotate: remove old, add new
    user.refreshTokens = user.refreshTokens.filter((t) => t !== oldRefreshToken);
    const { accessToken, refreshToken } = await this.generateTokens(user);

    return { accessToken, refreshToken };
  }

  /**
   * Generate OTP for email/phone verification
   */
  async generateOTP(email: string): Promise<string> {
    const user = await User.findOne({ email });
    if (!user) throw new NotFoundError('User');

    const code = crypto.randomInt(100000, 999999).toString();
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
  async verifyOTP(email: string, code: string, purpose: string): Promise<boolean> {
    const user = await User.findOne({ email });
    if (!user || !user.otp) throw new BadRequestError('No OTP request found');

    if (user.otp.attempts >= 5) {
      user.otp = undefined as any;
      await user.save();
      throw new BadRequestError('Too many OTP attempts. Please request a new code.');
    }

    if (new Date() > user.otp.expiresAt) {
      throw new BadRequestError('OTP has expired');
    }

    if (user.otp.code !== code) {
      user.otp.attempts += 1;
      await user.save();
      throw new BadRequestError('Invalid OTP');
    }

    // OTP valid — apply action
    if (purpose === 'verify_email') user.isEmailVerified = true;
    if (purpose === 'verify_phone') user.isPhoneVerified = true;
    user.otp = undefined as any;
    await user.save();

    return true;
  }

  /**
   * Logout — remove refresh token
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: refreshToken },
    });
    logger.info({ userId }, 'User logged out');
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  // --- Private helpers ---

  private async generateTokens(user: IUser): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { userId: user._id, email: user.email, role: user.role };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY as any,
    });

    const refreshToken = jwt.sign(
      { userId: user._id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRY as any }
    );

    // Store refresh token (keep max 5 sessions)
    const userDoc = await User.findById(user._id).select('+refreshTokens');
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

export const authService = new AuthService();
