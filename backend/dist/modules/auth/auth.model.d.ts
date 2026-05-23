import { Document, Model } from 'mongoose';
export interface IUser extends Document {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    role: 'user' | 'provider' | 'admin';
    authProvider: 'local' | 'google';
    googleId?: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    otp?: {
        code: string;
        expiresAt: Date;
        attempts: number;
    };
    refreshTokens: string[];
    preferences: {
        currency: string;
        language: string;
        notifications: {
            email: boolean;
            sms: boolean;
            push: boolean;
        };
    };
    lastLoginAt?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    fullName: string;
}
export declare const User: Model<IUser>;
export default User;
//# sourceMappingURL=auth.model.d.ts.map