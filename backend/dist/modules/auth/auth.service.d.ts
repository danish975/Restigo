import { IUser } from './auth.model';
import type { RegisterDto, LoginDto } from './auth.dto';
export declare class AuthService {
    /**
     * Register a new user with email/password
     */
    register(data: RegisterDto): Promise<{
        user: IUser;
        accessToken: string;
        refreshToken: string;
    }>;
    /**
     * Login with email/password
     */
    login(data: LoginDto): Promise<{
        user: IUser;
        accessToken: string;
        refreshToken: string;
    }>;
    /**
     * Handle Google OAuth callback
     */
    googleAuth(profile: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatar?: string;
    }): Promise<{
        user: IUser;
        accessToken: string;
        refreshToken: string;
    }>;
    /**
     * Refresh access token using refresh token
     */
    refreshAccessToken(oldRefreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    /**
     * Generate OTP for email/phone verification
     */
    generateOTP(email: string): Promise<string>;
    /**
     * Verify OTP
     */
    verifyOTP(email: string, code: string, purpose: string): Promise<boolean>;
    /**
     * Logout — remove refresh token
     */
    logout(userId: string, refreshToken: string): Promise<void>;
    /**
     * Get user profile
     */
    getProfile(userId: string): Promise<IUser>;
    private generateTokens;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map