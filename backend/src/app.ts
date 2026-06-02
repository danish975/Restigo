import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import passport from 'passport';
import { globalErrorHandler, notFoundHandler } from './core/middleware/errorHandler';
import env from './config/environment';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import propertyRoutes from './modules/property/property.routes';
import roomRoutes from './modules/room/room.routes';
import bookingRoutes from './modules/booking/booking.routes';
import searchRoutes from './modules/search/search.routes';
import paymentRoutes from './modules/payment/payment.routes';

const app = express();

// ─── Security Middleware ───
app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many auth attempts' } },
});

app.use(generalLimiter);

// ─── Body Parsing ───
// Stripe/Razorpay webhooks need raw body
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Data Sanitization ───
app.use(mongoSanitize());
app.use(hpp());
app.use(compression());

// Initialize Passport
app.use(passport.initialize());

// ─── Health Check ───
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'restigo-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
  });
});

// ─── API Routes ───
const apiPrefix = `/api/${env.API_VERSION}`;

app.use(`${apiPrefix}/auth`, authLimiter, authRoutes);
app.use(`${apiPrefix}/properties`, propertyRoutes);
app.use(`${apiPrefix}/rooms`, roomRoutes);
app.use(`${apiPrefix}/bookings`, bookingRoutes);
app.use(`${apiPrefix}/search`, searchRoutes);
app.use(`${apiPrefix}/payments`, paymentRoutes);

// Dynamically import to avoid cluttering top imports
app.use(`${apiPrefix}/reviews`, require('./modules/review/review.routes').default);
app.use(`${apiPrefix}/notifications`, require('./modules/notification/notification.routes').default);
app.use(`${apiPrefix}/inventory`, require('./modules/inventory/inventory.routes').default);
app.use(`${apiPrefix}/dashboard/user`, require('./modules/dashboard/user-dashboard.routes').default);
app.use(`${apiPrefix}/dashboard/provider`, require('./modules/dashboard/provider-dashboard.routes').default);
app.use(`${apiPrefix}/dashboard/admin`, require('./modules/dashboard/admin-dashboard.routes').default);

// ─── Error Handling ───
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
