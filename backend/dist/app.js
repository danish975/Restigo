"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const hpp_1 = __importDefault(require("hpp"));
const errorHandler_1 = require("./core/middleware/errorHandler");
const environment_1 = __importDefault(require("./config/environment"));
// Import routes
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const property_routes_1 = __importDefault(require("./modules/property/property.routes"));
const room_routes_1 = __importDefault(require("./modules/room/room.routes"));
const booking_routes_1 = __importDefault(require("./modules/booking/booking.routes"));
const search_routes_1 = __importDefault(require("./modules/search/search.routes"));
const payment_routes_1 = __importDefault(require("./modules/payment/payment.routes"));
const app = (0, express_1.default)();
// ─── Security Middleware ───
app.use((0, helmet_1.default)({
    contentSecurityPolicy: environment_1.default.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
}));
app.use((0, cors_1.default)({
    origin: environment_1.default.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
// Rate limiting
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200,
    message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
    standardHeaders: true,
    legacyHeaders: false,
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many auth attempts' } },
});
app.use(generalLimiter);
// ─── Body Parsing ───
// Stripe/Razorpay webhooks need raw body
app.use('/api/v1/payments/webhook', express_1.default.raw({ type: 'application/json' }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
// ─── Data Sanitization ───
app.use((0, express_mongo_sanitize_1.default)());
app.use((0, hpp_1.default)());
app.use((0, compression_1.default)());
// ─── Health Check ───
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'restigo-api',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: environment_1.default.NODE_ENV,
    });
});
// ─── API Routes ───
const apiPrefix = `/api/${environment_1.default.API_VERSION}`;
app.use(`${apiPrefix}/auth`, authLimiter, auth_routes_1.default);
app.use(`${apiPrefix}/properties`, property_routes_1.default);
app.use(`${apiPrefix}/rooms`, room_routes_1.default);
app.use(`${apiPrefix}/bookings`, booking_routes_1.default);
app.use(`${apiPrefix}/search`, search_routes_1.default);
app.use(`${apiPrefix}/payments`, payment_routes_1.default);
// Dynamically import to avoid cluttering top imports
app.use(`${apiPrefix}/reviews`, require('./modules/review/review.routes').default);
app.use(`${apiPrefix}/notifications`, require('./modules/notification/notification.routes').default);
app.use(`${apiPrefix}/inventory`, require('./modules/inventory/inventory.routes').default);
app.use(`${apiPrefix}/dashboard/user`, require('./modules/dashboard/user-dashboard.routes').default);
app.use(`${apiPrefix}/dashboard/provider`, require('./modules/dashboard/provider-dashboard.routes').default);
app.use(`${apiPrefix}/dashboard/admin`, require('./modules/dashboard/admin-dashboard.routes').default);
// ─── Error Handling ───
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.globalErrorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map