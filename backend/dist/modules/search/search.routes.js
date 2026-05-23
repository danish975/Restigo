"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const property_model_1 = require("../property/property.model");
const inventory_slot_model_1 = require("../inventory/inventory-slot.model");
const redis_1 = require("../../config/redis");
const validate_1 = require("../../core/middleware/validate");
const auth_1 = require("../../core/middleware/auth");
const http_status_codes_1 = require("http-status-codes");
const router = (0, express_1.Router)();
const searchQueryDto = zod_1.z.object({
    lat: zod_1.z.coerce.number().min(-90).max(90).optional(),
    lng: zod_1.z.coerce.number().min(-180).max(180).optional(),
    radius: zod_1.z.coerce.number().min(0.5).max(100).default(10), // km
    type: zod_1.z.string().optional(),
    minPrice: zod_1.z.coerce.number().min(0).optional(),
    maxPrice: zod_1.z.coerce.number().min(0).optional(),
    amenities: zod_1.z.string().optional(), // comma-separated
    rating: zod_1.z.coerce.number().min(0).max(5).optional(),
    date: zod_1.z.string().optional(),
    startTime: zod_1.z.string().optional(),
    endTime: zod_1.z.string().optional(),
    duration: zod_1.z.coerce.number().min(30).optional(),
    sortBy: zod_1.z.enum(['distance', 'price_low', 'price_high', 'rating']).default('distance'),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
    city: zod_1.z.string().optional(),
    q: zod_1.z.string().optional(), // text search
});
// GET /search — Search properties with geo + filters
router.get('/', auth_1.optionalAuth, (0, validate_1.validate)(searchQueryDto, 'query'), async (req, res, next) => {
    try {
        const q = req.query;
        const page = q.page || 1;
        const limit = q.limit || 20;
        // Build cache key
        const cacheKey = `search:${JSON.stringify(q)}`;
        const cached = await redis_1.redisClient.get(cacheKey);
        if (cached) {
            res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: JSON.parse(cached), _cached: true });
            return;
        }
        // Build aggregation pipeline
        const pipeline = [];
        // Geo-near stage (if coordinates provided)
        if (q.lat && q.lng) {
            pipeline.push({
                $geoNear: {
                    near: { type: 'Point', coordinates: [parseFloat(q.lng), parseFloat(q.lat)] },
                    distanceField: 'distance',
                    maxDistance: (q.radius || 10) * 1000, // km to meters
                    spherical: true,
                    query: { status: 'active' },
                },
            });
        }
        else {
            pipeline.push({ $match: { status: 'active' } });
        }
        // Type filter
        if (q.type) {
            pipeline.push({ $match: { type: q.type } });
        }
        // City filter
        if (q.city) {
            pipeline.push({ $match: { 'location.city': { $regex: q.city, $options: 'i' } } });
        }
        // Price filter
        if (q.minPrice || q.maxPrice) {
            const priceMatch = {};
            if (q.minPrice)
                priceMatch['priceRange.min'] = { $gte: parseFloat(q.minPrice) };
            if (q.maxPrice)
                priceMatch['priceRange.max'] = { $lte: parseFloat(q.maxPrice) };
            pipeline.push({ $match: priceMatch });
        }
        // Amenities filter
        if (q.amenities) {
            const amenityList = q.amenities.split(',').map((a) => a.trim());
            pipeline.push({ $match: { amenities: { $all: amenityList } } });
        }
        // Rating filter
        if (q.rating) {
            pipeline.push({ $match: { 'rating.average': { $gte: parseFloat(q.rating) } } });
        }
        // Text search
        if (q.q) {
            pipeline.push({
                $match: {
                    $or: [
                        { name: { $regex: q.q, $options: 'i' } },
                        { description: { $regex: q.q, $options: 'i' } },
                        { 'location.address': { $regex: q.q, $options: 'i' } },
                    ],
                },
            });
        }
        // Sort
        const sortStage = {};
        switch (q.sortBy) {
            case 'price_low':
                sortStage['priceRange.min'] = 1;
                break;
            case 'price_high':
                sortStage['priceRange.max'] = -1;
                break;
            case 'rating':
                sortStage['rating.average'] = -1;
                break;
            default: if (q.lat && q.lng)
                sortStage.distance = 1;
            else
                sortStage['rating.average'] = -1;
        }
        pipeline.push({ $sort: sortStage });
        // Count total before pagination
        const countPipeline = [...pipeline, { $count: 'total' }];
        // Pagination
        pipeline.push({ $skip: (page - 1) * limit });
        pipeline.push({ $limit: limit });
        // Project only needed fields
        pipeline.push({
            $project: {
                name: 1, slug: 1, type: 1, images: { $slice: ['$images', 1] },
                location: 1, amenities: 1, rating: 1, priceRange: 1,
                operatingHours: 1, featured: 1, distance: 1,
            },
        });
        const [results, countResult] = await Promise.all([
            property_model_1.Property.aggregate(pipeline),
            property_model_1.Property.aggregate(countPipeline),
        ]);
        const total = countResult[0]?.total || 0;
        const data = {
            properties: results,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
        // Cache for 30 seconds
        await redis_1.redisClient.setex(cacheKey, 30, JSON.stringify(data));
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
// GET /search/slots — Search available slots for a property
router.get('/slots', auth_1.optionalAuth, async (req, res, next) => {
    try {
        const { propertyId, roomId, date, startTime, endTime } = req.query;
        if (!propertyId) {
            res.status(400).json({ success: false, error: { message: 'propertyId is required' } });
            return;
        }
        const filter = { propertyId, status: 'available' };
        if (roomId)
            filter.roomId = roomId;
        if (date)
            filter.date = new Date(date);
        if (startTime)
            filter.startTime = { $gte: startTime };
        if (endTime)
            filter.endTime = { $lte: endTime };
        const slots = await inventory_slot_model_1.InventorySlot.find(filter)
            .populate('roomId', 'name type basePrice amenities capacity')
            .sort({ startTime: 1 });
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: { slots } });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=search.routes.js.map