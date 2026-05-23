"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bookingSchema = new mongoose_1.Schema({
    bookingCode: { type: String, unique: true, required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    propertyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    roomId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Room', required: true },
    slotIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'InventorySlot', required: true }],
    status: {
        type: String,
        enum: ['pending_hold', 'held', 'pending_payment', 'confirmed', 'checked_in', 'completed', 'cancelled', 'refunded', 'failed', 'no_show'],
        default: 'pending_hold', index: true,
    },
    checkIn: { date: { type: Date, required: true }, time: { type: String, required: true } },
    checkOut: { date: { type: Date, required: true }, time: { type: String, required: true } },
    totalDurationMinutes: { type: Number, required: true, min: 30 },
    pricing: {
        baseAmount: { type: Number, required: true, min: 0 },
        dynamicAmount: { type: Number, default: 0 },
        discount: { type: Number, default: 0, min: 0 },
        taxes: { type: Number, default: 0, min: 0 },
        totalAmount: { type: Number, required: true, min: 0 },
        currency: { type: String, default: 'INR' },
    },
    paymentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Payment' },
    paymentProvider: { type: String, enum: ['stripe', 'razorpay'] },
    externalPaymentId: { type: String },
    holdExpiresAt: { type: Date },
    guests: {
        adults: { type: Number, default: 1, min: 1 },
        children: { type: Number, default: 0, min: 0 },
    },
    specialRequests: { type: String, maxlength: 1000 },
    cancellation: {
        reason: { type: String },
        cancelledAt: { type: Date },
        refundAmount: { type: Number, min: 0 },
        refundStatus: { type: String, enum: ['pending', 'processed', 'failed'] },
    },
    idempotencyKey: { type: String, unique: true, required: true },
    version: { type: Number, default: 0 },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: {} },
}, { timestamps: true, optimisticConcurrency: true });
bookingSchema.index({ userId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ propertyId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ status: 1, holdExpiresAt: 1 });
bookingSchema.index({ idempotencyKey: 1 }, { unique: true });
bookingSchema.index({ externalPaymentId: 1 }, { sparse: true });
bookingSchema.pre('save', function (next) {
    if (!this.bookingCode) {
        const ts = Date.now().toString(36).toUpperCase();
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.bookingCode = `RST-${ts}-${rand}`;
    }
    next();
});
exports.Booking = mongoose_1.default.model('Booking', bookingSchema);
exports.default = exports.Booking;
//# sourceMappingURL=booking.model.js.map