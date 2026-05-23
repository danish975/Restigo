import { cleanEnv, str, port, num, url } from 'envalid';
import dotenv from 'dotenv';

dotenv.config();

const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
  PORT: port({ default: 5000 }),
  API_VERSION: str({ default: 'v1' }),

  // MongoDB
  MONGODB_URI: str({ default: 'mongodb://localhost:27017/restigo?replicaSet=rs0' }),

  // Redis
  REDIS_HOST: str({ default: 'localhost' }),
  REDIS_PORT: port({ default: 6379 }),
  REDIS_PASSWORD: str({ default: '' }),

  // JWT
  JWT_ACCESS_SECRET: str({ default: 'dev-access-secret-change-me' }),
  JWT_REFRESH_SECRET: str({ default: 'dev-refresh-secret-change-me' }),
  JWT_ACCESS_EXPIRY: str({ default: '15m' }),
  JWT_REFRESH_EXPIRY: str({ default: '7d' }),

  // Google OAuth
  GOOGLE_CLIENT_ID: str({ default: '' }),
  GOOGLE_CLIENT_SECRET: str({ default: '' }),
  GOOGLE_CALLBACK_URL: str({ default: 'http://localhost:5000/api/v1/auth/google/callback' }),

  // Stripe
  STRIPE_SECRET_KEY: str({ default: '' }),
  STRIPE_WEBHOOK_SECRET: str({ default: '' }),
  STRIPE_PUBLISHABLE_KEY: str({ default: '' }),

  // Razorpay
  RAZORPAY_KEY_ID: str({ default: '' }),
  RAZORPAY_KEY_SECRET: str({ default: '' }),
  RAZORPAY_WEBHOOK_SECRET: str({ default: '' }),

  // Resend
  RESEND_API_KEY: str({ default: '' }),
  FROM_EMAIL: str({ default: 'bookings@restigo.app' }),

  // Twilio
  TWILIO_ACCOUNT_SID: str({ default: '' }),
  TWILIO_AUTH_TOKEN: str({ default: '' }),
  TWILIO_PHONE_NUMBER: str({ default: '' }),

  // ML Service
  ML_SERVICE_URL: str({ default: 'http://localhost:8000' }),

  // Frontend
  FRONTEND_URL: str({ default: 'http://localhost:3000' }),

  // Booking
  HOLD_DURATION_MINUTES: num({ default: 5 }),
  LOCK_TTL_MS: num({ default: 10000 }),
});

export default env;
