import { z } from 'zod';

export const registerDto = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().optional(),
  role: z.enum(['user', 'provider']).default('user'),
});

export const loginDto = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenDto = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const otpRequestDto = z.object({
  email: z.string().email('Invalid email address'),
  purpose: z.enum(['verify_email', 'verify_phone', 'reset_password']),
});

export const otpVerifyDto = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'OTP must be 6 digits'),
  purpose: z.enum(['verify_email', 'verify_phone', 'reset_password']),
});

export type RegisterDto = z.infer<typeof registerDto>;
export type LoginDto = z.infer<typeof loginDto>;
export type RefreshTokenDto = z.infer<typeof refreshTokenDto>;
export type OtpRequestDto = z.infer<typeof otpRequestDto>;
export type OtpVerifyDto = z.infer<typeof otpVerifyDto>;
