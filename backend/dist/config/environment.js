"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const envalid_1 = require("envalid");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const env = (0, envalid_1.cleanEnv)(process.env, {
    NODE_ENV: (0, envalid_1.str)({ choices: ['development', 'production', 'test'], default: 'development' }),
    PORT: (0, envalid_1.port)({ default: 5000 }),
    API_VERSION: (0, envalid_1.str)({ default: 'v1' }),
    // MongoDB
    MONGODB_URI: (0, envalid_1.str)({ default: 'mongodb://localhost:27017/restigo?replicaSet=rs0' }),
    // Redis
    REDIS_HOST: (0, envalid_1.str)({ default: 'localhost' }),
    REDIS_PORT: (0, envalid_1.port)({ default: 6379 }),
    REDIS_PASSWORD: (0, envalid_1.str)({ default: '' }),
    // JWT
    JWT_ACCESS_SECRET: (0, envalid_1.str)({ default: 'dev-access-secret-change-me' }),
    JWT_REFRESH_SECRET: (0, envalid_1.str)({ default: 'dev-refresh-secret-change-me' }),
    JWT_ACCESS_EXPIRY: (0, envalid_1.str)({ default: '15m' }),
    JWT_REFRESH_EXPIRY: (0, envalid_1.str)({ default: '7d' }),
    // Google OAuth
    GOOGLE_CLIENT_ID: (0, envalid_1.str)({ default: '' }),
    GOOGLE_CLIENT_SECRET: (0, envalid_1.str)({ default: '' }),
    GOOGLE_CALLBACK_URL: (0, envalid_1.str)({ default: 'http://localhost:5000/api/v1/auth/google/callback' }),
    // Stripe
    STRIPE_SECRET_KEY: (0, envalid_1.str)({ default: '' }),
    STRIPE_WEBHOOK_SECRET: (0, envalid_1.str)({ default: '' }),
    STRIPE_PUBLISHABLE_KEY: (0, envalid_1.str)({ default: '' }),
    // Razorpay
    RAZORPAY_KEY_ID: (0, envalid_1.str)({ default: '' }),
    RAZORPAY_KEY_SECRET: (0, envalid_1.str)({ default: '' }),
    RAZORPAY_WEBHOOK_SECRET: (0, envalid_1.str)({ default: '' }),
    // Resend
    RESEND_API_KEY: (0, envalid_1.str)({ default: '' }),
    FROM_EMAIL: (0, envalid_1.str)({ default: 'bookings@restigo.app' }),
    // Twilio
    TWILIO_ACCOUNT_SID: (0, envalid_1.str)({ default: '' }),
    TWILIO_AUTH_TOKEN: (0, envalid_1.str)({ default: '' }),
    TWILIO_PHONE_NUMBER: (0, envalid_1.str)({ default: '' }),
    // ML Service
    ML_SERVICE_URL: (0, envalid_1.str)({ default: 'http://localhost:8000' }),
    // Frontend
    FRONTEND_URL: (0, envalid_1.str)({ default: 'http://localhost:3000' }),
    // Booking
    HOLD_DURATION_MINUTES: (0, envalid_1.num)({ default: 5 }),
    LOCK_TTL_MS: (0, envalid_1.num)({ default: 10000 }),
});
exports.default = env;
//# sourceMappingURL=environment.js.map