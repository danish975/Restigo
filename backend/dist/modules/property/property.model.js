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
exports.Property = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const propertySchema = new mongoose_1.Schema({
    providerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: [true, 'Property name is required'],
        trim: true,
        maxlength: 200,
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        maxlength: 5000,
    },
    type: {
        type: String,
        required: true,
        enum: ['hotel', 'transit_room', 'coworking', 'nap_pod', 'lounge', 'capsule_hotel', 'meeting_room', 'short_stay_apartment'],
        index: true,
    },
    images: {
        type: [String],
        validate: [
            (val) => val.length <= 20,
            'Maximum 20 images allowed',
        ],
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            required: [true, 'Coordinates are required'],
            validate: {
                validator: (val) => val.length === 2 &&
                    val[0] >= -180 && val[0] <= 180 &&
                    val[1] >= -90 && val[1] <= 90,
                message: 'Invalid coordinates',
            },
        },
        address: { type: String, required: true },
        city: { type: String, required: true, index: true },
        state: { type: String, required: true },
        country: { type: String, required: true, index: true },
        zipCode: { type: String },
        landmark: { type: String },
    },
    amenities: {
        type: [String],
        enum: [
            'wifi', 'parking', 'ac', 'tv', 'minibar', 'safe', 'room_service',
            'laundry', 'gym', 'pool', 'spa', 'restaurant', 'bar', 'conference_room',
            'business_center', 'shuttle', 'ev_charging', 'pet_friendly', 'wheelchair_accessible',
            'power_outlets', 'printer', 'whiteboard', 'projector', 'coffee_machine',
            'shower', 'locker', 'quiet_zone', 'phone_booth', 'kitchen',
        ],
        index: true,
    },
    policies: {
        checkInTime: { type: String, default: '00:00' },
        checkOutTime: { type: String, default: '23:59' },
        cancellationPolicy: {
            type: String,
            enum: ['flexible', 'moderate', 'strict'],
            default: 'moderate',
        },
        minBookingHours: { type: Number, default: 1, min: 1 },
        maxBookingHours: { type: Number, default: 24, max: 72 },
        allowPets: { type: Boolean, default: false },
        smokingAllowed: { type: Boolean, default: false },
    },
    contact: {
        phone: { type: String, required: true },
        email: { type: String, required: true },
        website: { type: String },
    },
    rating: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0, min: 0 },
    },
    priceRange: {
        min: { type: Number, required: true, min: 0 },
        max: { type: Number, required: true, min: 0 },
        currency: { type: String, default: 'INR' },
    },
    operatingHours: {
        open: { type: String, default: '00:00' },
        close: { type: String, default: '23:59' },
        is24Hours: { type: Boolean, default: false },
        closedDays: { type: [Number], default: [] },
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'suspended', 'archived'],
        default: 'pending',
        index: true,
    },
    isVerified: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    totalRooms: { type: Number, default: 0, min: 0 },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: {} },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Geospatial index for location-based queries
propertySchema.index({ 'location': '2dsphere' });
// Compound indexes for search optimization
propertySchema.index({ type: 1, status: 1, 'rating.average': -1 });
propertySchema.index({ 'location.city': 1, type: 1, status: 1 });
propertySchema.index({ status: 1, featured: -1, 'rating.average': -1 });
propertySchema.index({ 'priceRange.min': 1, 'priceRange.max': 1 });
propertySchema.index({ providerId: 1, status: 1 });
propertySchema.index({ slug: 1 }, { unique: true });
// Virtual: rooms
propertySchema.virtual('rooms', {
    ref: 'Room',
    localField: '_id',
    foreignField: 'propertyId',
});
// Pre-save: generate slug
propertySchema.pre('save', function (next) {
    if (this.isModified('name') || !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            + '-' + Date.now().toString(36);
    }
    next();
});
exports.Property = mongoose_1.default.model('Property', propertySchema);
exports.default = exports.Property;
//# sourceMappingURL=property.model.js.map