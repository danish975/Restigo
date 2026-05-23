import { z } from 'zod';
export declare const registerDto: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodDefault<z.ZodEnum<["user", "provider"]>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "user" | "provider";
    phone?: string | undefined;
}, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string | undefined;
    role?: "user" | "provider" | undefined;
}>;
export declare const loginDto: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const refreshTokenDto: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const otpRequestDto: z.ZodObject<{
    email: z.ZodString;
    purpose: z.ZodEnum<["verify_email", "verify_phone", "reset_password"]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    purpose: "verify_email" | "verify_phone" | "reset_password";
}, {
    email: string;
    purpose: "verify_email" | "verify_phone" | "reset_password";
}>;
export declare const otpVerifyDto: z.ZodObject<{
    email: z.ZodString;
    code: z.ZodString;
    purpose: z.ZodEnum<["verify_email", "verify_phone", "reset_password"]>;
}, "strip", z.ZodTypeAny, {
    code: string;
    email: string;
    purpose: "verify_email" | "verify_phone" | "reset_password";
}, {
    code: string;
    email: string;
    purpose: "verify_email" | "verify_phone" | "reset_password";
}>;
export type RegisterDto = z.infer<typeof registerDto>;
export type LoginDto = z.infer<typeof loginDto>;
export type RefreshTokenDto = z.infer<typeof refreshTokenDto>;
export type OtpRequestDto = z.infer<typeof otpRequestDto>;
export type OtpVerifyDto = z.infer<typeof otpVerifyDto>;
//# sourceMappingURL=auth.dto.d.ts.map