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
exports.InventorySlot = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const inventorySlotSchema = new mongoose_1.Schema({
    roomId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
        index: true,
    },
    propertyId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Property',
        required: true,
        index: true,
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        index: true,
    },
    startTime: {
        type: String,
        required: [true, 'Start time is required'],
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'],
    },
    endTime: {
        type: String,
        required: [true, 'End time is required'],
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'],
    },
    durationMinutes: {
        type: Number,
        required: true,
        min: 30,
        max: 1440, // 24 hours
    },
    status: {
        type: String,
        enum: ['available', 'held', 'booked', 'blocked', 'expired'],
        default: 'available',
        index: true,
    },
    basePrice: {
        type: Number,
        required: [true, 'Base price is required'],
        min: 0,
    },
    dynamicPrice: {
        type: Number,
        min: 0,
    },
    currency: { type: String, default: 'INR' },
    holdExpiresAt: {
        type: Date,
        index: true,
    },
    heldBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    bookedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    bookingId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Booking',
    },
    lockId: { type: String },
    version: { type: Number, default: 0 },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: {} },
}, {
    timestamps: true,
    optimisticConcurrency: true, // Enables __v based optimistic locking
});
// CRITICAL: Unique compound index prevents double-booking at database level
inventorySlotSchema.index({ roomId: 1, date: 1, startTime: 1 }, { unique: true });
// TTL index: auto-delete expired hold marker documents
// Note: We don't auto-delete slots, but we use this to find and clean expired holds
inventorySlotSchema.index({ holdExpiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: 'held' } });
// Compound indexes for search queries
inventorySlotSchema.index({ propertyId: 1, date: 1, status: 1 });
inventorySlotSchema.index({ roomId: 1, date: 1, status: 1, startTime: 1 });
inventorySlotSchema.index({ status: 1, date: 1 });
inventorySlotSchema.index({ bookedBy: 1, status: 1 });
// Get effective price (dynamic or base)
inventorySlotSchema.virtual('effectivePrice').get(function () {
    return this.dynamicPrice ?? this.basePrice;
});
exports.InventorySlot = mongoose_1.default.model('InventorySlot', inventorySlotSchema);
exports.default = exports.InventorySlot;
//# sourceMappingURL=inventory-slot.model.js.map