"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const inventory_slot_model_1 = require("./inventory-slot.model");
const room_model_1 = require("../room/room.model");
const property_model_1 = require("../property/property.model");
const auth_1 = require("../../core/middleware/auth");
const validate_1 = require("../../core/middleware/validate");
const errors_1 = require("../../core/errors");
const router = (0, express_1.Router)();
// ─── DTOs ───
const generateSlotsDto = zod_1.z.object({
    roomId: zod_1.z.string().min(1),
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    slotDurationMinutes: zod_1.z.number().min(30).max(1440).default(60),
    startHour: zod_1.z.number().min(0).max(23).default(6),
    endHour: zod_1.z.number().min(1).max(24).default(24),
    basePrice: zod_1.z.number().min(0),
});
const bulkUpdateDto = zod_1.z.object({
    slotIds: zod_1.z.array(zod_1.z.string()).min(1).max(100),
    updates: zod_1.z.object({
        status: zod_1.z.enum(['available', 'blocked']).optional(),
        basePrice: zod_1.z.number().min(0).optional(),
    }),
});
// ─── Generate Slots for a Room ───
router.post('/generate', auth_1.authenticate, (0, auth_1.authorize)('provider', 'admin'), (0, validate_1.validate)(generateSlotsDto), async (req, res, next) => {
    try {
        const { roomId, startDate, endDate, slotDurationMinutes, startHour, endHour, basePrice } = req.body;
        const userId = req.user.userId;
        // Verify room and ownership
        const room = await room_model_1.Room.findById(roomId).populate('propertyId');
        if (!room)
            throw new errors_1.NotFoundError('Room');
        const property = await property_model_1.Property.findOne({
            _id: room.propertyId,
            providerId: userId,
        });
        if (!property && req.user.role !== 'admin') {
            throw new errors_1.BadRequestError('You do not own this property');
        }
        const slots = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            for (let hour = startHour; hour < endHour; hour += slotDurationMinutes / 60) {
                const startMinutes = Math.round(hour * 60);
                const endMinutes = startMinutes + slotDurationMinutes;
                if (endMinutes > endHour * 60)
                    break;
                const startTimeStr = `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(startMinutes % 60).padStart(2, '0')}`;
                const endTimeStr = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
                slots.push({
                    roomId,
                    propertyId: room.propertyId,
                    date: new Date(dateStr),
                    startTime: startTimeStr,
                    endTime: endTimeStr,
                    durationMinutes: slotDurationMinutes,
                    status: 'available',
                    basePrice,
                    currency: 'INR',
                });
            }
        }
        // Use ordered: false to skip duplicates (compound index will reject)
        const result = await inventory_slot_model_1.InventorySlot.insertMany(slots, { ordered: false }).catch((err) => {
            if (err.code === 11000) {
                // Some duplicates, but others inserted
                return err.insertedDocs || [];
            }
            throw err;
        });
        const insertedCount = Array.isArray(result) ? result.length : result.length || 0;
        res.status(201).json({
            success: true,
            data: {
                totalGenerated: slots.length,
                insertedCount,
                skippedDuplicates: slots.length - insertedCount,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// ─── Get Available Slots for a Room/Property ───
router.get('/availability', async (req, res, next) => {
    try {
        const { roomId, propertyId, date, startDate, endDate } = req.query;
        const filter = { status: 'available' };
        if (roomId)
            filter.roomId = roomId;
        if (propertyId)
            filter.propertyId = propertyId;
        if (date) {
            filter.date = new Date(date);
        }
        else if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const slots = await inventory_slot_model_1.InventorySlot.find(filter)
            .populate('roomId', 'name type amenities')
            .sort({ date: 1, startTime: 1 })
            .limit(500);
        res.json({ success: true, data: slots });
    }
    catch (error) {
        next(error);
    }
});
// ─── Get Slot by ID ───
router.get('/:slotId', async (req, res, next) => {
    try {
        const slot = await inventory_slot_model_1.InventorySlot.findById(req.params.slotId)
            .populate('roomId')
            .populate('propertyId', 'name images location');
        if (!slot)
            throw new errors_1.NotFoundError('Inventory slot');
        res.json({ success: true, data: slot });
    }
    catch (error) {
        next(error);
    }
});
// ─── Bulk Update Slots ───
router.patch('/bulk-update', auth_1.authenticate, (0, auth_1.authorize)('provider', 'admin'), (0, validate_1.validate)(bulkUpdateDto), async (req, res, next) => {
    try {
        const { slotIds, updates } = req.body;
        const result = await inventory_slot_model_1.InventorySlot.updateMany({
            _id: { $in: slotIds },
            status: { $in: ['available', 'blocked'] }, // Can't update held/booked slots
        }, { $set: updates });
        res.json({
            success: true,
            data: { modifiedCount: result.modifiedCount },
        });
    }
    catch (error) {
        next(error);
    }
});
// ─── Provider: Get Inventory Stats ───
router.get('/stats/:propertyId', auth_1.authenticate, (0, auth_1.authorize)('provider', 'admin'), async (req, res, next) => {
    try {
        const { propertyId } = req.params;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const stats = await inventory_slot_model_1.InventorySlot.aggregate([
            {
                $match: {
                    propertyId: new (require('mongoose').Types.ObjectId)(propertyId),
                    date: { $gte: today },
                },
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'booked'] }, '$basePrice', 0] } },
                },
            },
        ]);
        const totalSlots = stats.reduce((sum, s) => sum + s.count, 0);
        const bookedSlots = stats.find((s) => s._id === 'booked')?.count || 0;
        const occupancyRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;
        res.json({
            success: true,
            data: {
                breakdown: stats,
                totalSlots,
                bookedSlots,
                occupancyRate,
                totalRevenue: stats.find((s) => s._id === 'booked')?.totalRevenue || 0,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=inventory.routes.js.map