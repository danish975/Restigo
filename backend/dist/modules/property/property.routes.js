"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const property_model_1 = require("./property.model");
const room_model_1 = require("../room/room.model");
const auth_1 = require("../../core/middleware/auth");
const validate_1 = require("../../core/middleware/validate");
const errors_1 = require("../../core/errors");
const http_status_codes_1 = require("http-status-codes");
const router = (0, express_1.Router)();
const createPropertyDto = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(10).max(5000),
    type: zod_1.z.enum(['hotel', 'transit_room', 'coworking', 'nap_pod', 'lounge', 'capsule_hotel', 'meeting_room', 'short_stay_apartment']),
    images: zod_1.z.array(zod_1.z.string().url()).max(20).default([]),
    location: zod_1.z.object({
        coordinates: zod_1.z.tuple([zod_1.z.number().min(-180).max(180), zod_1.z.number().min(-90).max(90)]),
        address: zod_1.z.string().min(1),
        city: zod_1.z.string().min(1),
        state: zod_1.z.string().min(1),
        country: zod_1.z.string().min(1),
        zipCode: zod_1.z.string().optional(),
        landmark: zod_1.z.string().optional(),
    }),
    amenities: zod_1.z.array(zod_1.z.string()).default([]),
    policies: zod_1.z.object({
        cancellationPolicy: zod_1.z.enum(['flexible', 'moderate', 'strict']).default('moderate'),
        minBookingHours: zod_1.z.number().int().min(1).default(1),
        maxBookingHours: zod_1.z.number().int().max(72).default(24),
        allowPets: zod_1.z.boolean().default(false),
        smokingAllowed: zod_1.z.boolean().default(false),
    }).default({}),
    contact: zod_1.z.object({
        phone: zod_1.z.string().min(1),
        email: zod_1.z.string().email(),
        website: zod_1.z.string().url().optional(),
    }),
    priceRange: zod_1.z.object({
        min: zod_1.z.number().min(0),
        max: zod_1.z.number().min(0),
        currency: zod_1.z.string().default('INR'),
    }),
    operatingHours: zod_1.z.object({
        open: zod_1.z.string().default('00:00'),
        close: zod_1.z.string().default('23:59'),
        is24Hours: zod_1.z.boolean().default(false),
        closedDays: zod_1.z.array(zod_1.z.number().int().min(0).max(6)).default([]),
    }).default({}),
});
// GET /properties — List properties (public)
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const type = req.query.type;
        const filter = { status: 'active' };
        if (type)
            filter.type = type;
        const [properties, total] = await Promise.all([
            property_model_1.Property.find(filter)
                .select('name slug type images location rating priceRange amenities operatingHours featured')
                .sort({ featured: -1, 'rating.average': -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            property_model_1.Property.countDocuments(filter),
        ]);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: { properties, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /properties/:slug — Get property detail
router.get('/:slug', async (req, res, next) => {
    try {
        const property = await property_model_1.Property.findOne({ slug: req.params.slug, status: 'active' });
        if (!property)
            throw new errors_1.NotFoundError('Property');
        const rooms = await room_model_1.Room.find({ propertyId: property._id, status: 'available', isActive: true })
            .select('name type basePrice currency amenities capacity images size');
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: { property, rooms } });
    }
    catch (error) {
        next(error);
    }
});
// POST /properties — Create property (provider only)
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('provider', 'admin'), (0, validate_1.validate)(createPropertyDto), async (req, res, next) => {
    try {
        const property = await property_model_1.Property.create({
            ...req.body,
            providerId: req.user.userId,
            location: { type: 'Point', ...req.body.location },
        });
        res.status(http_status_codes_1.StatusCodes.CREATED).json({ success: true, data: { property } });
    }
    catch (error) {
        next(error);
    }
});
// PUT /properties/:id — Update property (owner only)
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)('provider', 'admin'), async (req, res, next) => {
    try {
        const property = await property_model_1.Property.findOneAndUpdate({ _id: req.params.id, providerId: req.user.userId }, { $set: req.body }, { new: true, runValidators: true });
        if (!property)
            throw new errors_1.NotFoundError('Property');
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: { property } });
    }
    catch (error) {
        next(error);
    }
});
// GET /properties/provider/mine — Provider's own properties
router.get('/provider/mine', auth_1.authenticate, (0, auth_1.authorize)('provider'), async (req, res, next) => {
    try {
        const properties = await property_model_1.Property.find({ providerId: req.user.userId }).sort({ createdAt: -1 });
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: { properties } });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=property.routes.js.map