"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const room_model_1 = require("./room.model");
const inventory_slot_model_1 = require("../inventory/inventory-slot.model");
const property_model_1 = require("../property/property.model");
const auth_1 = require("../../core/middleware/auth");
const validate_1 = require("../../core/middleware/validate");
const errors_1 = require("../../core/errors");
const http_status_codes_1 = require("http-status-codes");
const router = (0, express_1.Router)();
const createRoomDto = zod_1.z.object({
    propertyId: zod_1.z.string(),
    name: zod_1.z.string().min(1).max(100),
    type: zod_1.z.enum(['standard', 'deluxe', 'suite', 'pod', 'capsule', 'desk', 'meeting_room', 'private_office', 'lounge_seat']),
    description: zod_1.z.string().max(2000).optional(),
    images: zod_1.z.array(zod_1.z.string()).max(10).default([]),
    floor: zod_1.z.number().int().default(1),
    roomNumber: zod_1.z.string().min(1),
    capacity: zod_1.z.object({ adults: zod_1.z.number().int().min(1).default(1), children: zod_1.z.number().int().min(0).default(0) }),
    basePrice: zod_1.z.number().min(0),
    currency: zod_1.z.string().default('INR'),
    amenities: zod_1.z.array(zod_1.z.string()).default([]),
    size: zod_1.z.object({ value: zod_1.z.number().min(0), unit: zod_1.z.enum(['sqft', 'sqm']).default('sqft') }).optional(),
    bedConfiguration: zod_1.z.string().optional(),
});
const generateSlotsDto = zod_1.z.object({
    roomId: zod_1.z.string(),
    date: zod_1.z.string(), // YYYY-MM-DD
    startHour: zod_1.z.number().int().min(0).max(23),
    endHour: zod_1.z.number().int().min(1).max(24),
    slotDurationMinutes: zod_1.z.number().int().min(30).max(480).default(60),
    pricePerSlot: zod_1.z.number().min(0).optional(),
});
// POST /rooms — Create room
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('provider', 'admin'), (0, validate_1.validate)(createRoomDto), async (req, res, next) => {
    try {
        const property = await property_model_1.Property.findOne({ _id: req.body.propertyId, providerId: req.user.userId });
        if (!property)
            throw new errors_1.ForbiddenError('Not authorized to add rooms to this property');
        const room = await room_model_1.Room.create(req.body);
        await property_model_1.Property.findByIdAndUpdate(property._id, { $inc: { totalRooms: 1 } });
        res.status(http_status_codes_1.StatusCodes.CREATED).json({ success: true, data: { room } });
    }
    catch (error) {
        next(error);
    }
});
// POST /rooms/generate-slots — Auto-generate inventory slots for a room
router.post('/generate-slots', auth_1.authenticate, (0, auth_1.authorize)('provider', 'admin'), (0, validate_1.validate)(generateSlotsDto), async (req, res, next) => {
    try {
        const { roomId, date, startHour, endHour, slotDurationMinutes, pricePerSlot } = req.body;
        const room = await room_model_1.Room.findById(roomId).populate('propertyId');
        if (!room)
            throw new errors_1.NotFoundError('Room');
        const property = await property_model_1.Property.findOne({ _id: room.propertyId, providerId: req.user.userId });
        if (!property)
            throw new errors_1.ForbiddenError('Not authorized');
        const slots = [];
        const dateObj = new Date(date);
        let currentMinutes = startHour * 60;
        const endMinutes = endHour * 60;
        while (currentMinutes + slotDurationMinutes <= endMinutes) {
            const startH = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
            const startM = (currentMinutes % 60).toString().padStart(2, '0');
            const endMins = currentMinutes + slotDurationMinutes;
            const endH = Math.floor(endMins / 60).toString().padStart(2, '0');
            const endM = (endMins % 60).toString().padStart(2, '0');
            slots.push({
                roomId: room._id,
                propertyId: property._id,
                date: dateObj,
                startTime: `${startH}:${startM}`,
                endTime: `${endH}:${endM}`,
                durationMinutes: slotDurationMinutes,
                status: 'available',
                basePrice: pricePerSlot || room.basePrice,
                currency: room.currency,
            });
            currentMinutes += slotDurationMinutes;
        }
        const created = await inventory_slot_model_1.InventorySlot.insertMany(slots, { ordered: false }).catch((err) => {
            // Handle duplicate key errors gracefully (slots already exist)
            if (err.code === 11000)
                return err.insertedDocs || [];
            throw err;
        });
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            data: { slotsCreated: Array.isArray(created) ? created.length : 0, slots: created },
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /rooms/:propertyId — Get rooms for a property
router.get('/:propertyId', async (req, res, next) => {
    try {
        const rooms = await room_model_1.Room.find({ propertyId: req.params.propertyId, isActive: true }).sort({ type: 1, roomNumber: 1 });
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: { rooms } });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=room.routes.js.map