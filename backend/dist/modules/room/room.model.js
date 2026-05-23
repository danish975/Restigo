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
exports.Room = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const roomSchema = new mongoose_1.Schema({
    propertyId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Property',
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: [true, 'Room name is required'],
        trim: true,
        maxlength: 100,
    },
    type: {
        type: String,
        required: true,
        enum: ['standard', 'deluxe', 'suite', 'pod', 'capsule', 'desk', 'meeting_room', 'private_office', 'lounge_seat'],
        index: true,
    },
    description: {
        type: String,
        maxlength: 2000,
    },
    images: {
        type: [String],
        validate: [(val) => val.length <= 10, 'Maximum 10 images per room'],
    },
    floor: { type: Number, default: 1 },
    roomNumber: {
        type: String,
        required: true,
        trim: true,
    },
    capacity: {
        adults: { type: Number, required: true, min: 1, default: 1 },
        children: { type: Number, default: 0, min: 0 },
    },
    basePrice: {
        type: Number,
        required: [true, 'Base price is required'],
        min: [0, 'Price cannot be negative'],
    },
    currency: { type: String, default: 'INR' },
    amenities: {
        type: [String],
        default: [],
    },
    size: {
        value: { type: Number, min: 0 },
        unit: { type: String, enum: ['sqft', 'sqm'], default: 'sqft' },
    },
    bedConfiguration: { type: String },
    status: {
        type: String,
        enum: ['available', 'maintenance', 'archived'],
        default: 'available',
        index: true,
    },
    isActive: { type: Boolean, default: true },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: {} },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Compound indexes
roomSchema.index({ propertyId: 1, status: 1, type: 1 });
roomSchema.index({ propertyId: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ basePrice: 1, type: 1 });
// Virtual: inventory slots
roomSchema.virtual('slots', {
    ref: 'InventorySlot',
    localField: '_id',
    foreignField: 'roomId',
});
exports.Room = mongoose_1.default.model('Room', roomSchema);
exports.default = exports.Room;
//# sourceMappingURL=room.model.js.map