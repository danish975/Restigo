import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { InventorySlot } from './inventory-slot.model';
import { Room } from '../room/room.model';
import { Property } from '../property/property.model';
import { authenticate, authorize } from '../../core/middleware/auth';
import { validate } from '../../core/middleware/validate';
import { BadRequestError, NotFoundError } from '../../core/errors';

const router = Router();

// ─── DTOs ───
const generateSlotsDto = z.object({
  roomId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotDurationMinutes: z.number().min(30).max(1440).default(60),
  startHour: z.number().min(0).max(23).default(6),
  endHour: z.number().min(1).max(24).default(24),
  basePrice: z.number().min(0),
});

const bulkUpdateDto = z.object({
  slotIds: z.array(z.string()).min(1).max(100),
  updates: z.object({
    status: z.enum(['available', 'blocked']).optional(),
    basePrice: z.number().min(0).optional(),
  }),
});

// ─── Generate Slots for a Room ───
router.post(
  '/generate',
  authenticate,
  authorize('provider', 'admin'),
  validate(generateSlotsDto),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roomId, startDate, endDate, slotDurationMinutes, startHour, endHour, basePrice } = req.body;
      const userId = (req as any).user.userId;

      // Verify room and ownership
      const room = await Room.findById(roomId).populate('propertyId');
      if (!room) throw new NotFoundError('Room');

      const property = await Property.findOne({
        _id: room.propertyId,
        providerId: userId,
      });

      if (!property && (req as any).user.role !== 'admin') {
        throw new BadRequestError('You do not own this property');
      }

      const slots: any[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];

        for (let hour = startHour; hour < endHour; hour += slotDurationMinutes / 60) {
          const startMinutes = Math.round(hour * 60);
          const endMinutes = startMinutes + slotDurationMinutes;

          if (endMinutes > endHour * 60) break;

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
      const result = await InventorySlot.insertMany(slots, { ordered: false }).catch((err) => {
        if (err.code === 11000) {
          // Some duplicates, but others inserted
          return err.insertedDocs || [];
        }
        throw err;
      });

      const insertedCount = Array.isArray(result) ? result.length : (result as any).length || 0;

      res.status(201).json({
        success: true,
        data: {
          totalGenerated: slots.length,
          insertedCount,
          skippedDuplicates: slots.length - insertedCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Get Available Slots for a Room/Property ───
router.get(
  '/availability',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roomId, propertyId, date, startDate, endDate } = req.query;

      const filter: any = { status: 'available' };
      if (roomId) filter.roomId = roomId;
      if (propertyId) filter.propertyId = propertyId;

      if (date) {
        const d = new Date(date as string);
        const nextDay = new Date(d);
        nextDay.setDate(nextDay.getDate() + 1);
        filter.date = { $gte: d, $lt: nextDay };
      } else if (startDate && endDate) {
        filter.date = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string),
        };
      }

      const slots = await InventorySlot.find(filter)
        .populate('roomId', 'name type amenities')
        .sort({ date: 1, startTime: 1 })
        .limit(500);

      res.json({ success: true, data: slots });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Get Slot by ID ───
router.get(
  '/:slotId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slot = await InventorySlot.findById(req.params.slotId)
        .populate('roomId')
        .populate('propertyId', 'name images location');

      if (!slot) throw new NotFoundError('Inventory slot');
      res.json({ success: true, data: slot });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Bulk Update Slots ───
router.patch(
  '/bulk-update',
  authenticate,
  authorize('provider', 'admin'),
  validate(bulkUpdateDto),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slotIds, updates } = req.body;

      const result = await InventorySlot.updateMany(
        {
          _id: { $in: slotIds },
          status: { $in: ['available', 'blocked'] }, // Can't update held/booked slots
        },
        { $set: updates }
      );

      res.json({
        success: true,
        data: { modifiedCount: result.modifiedCount },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Provider: Get Inventory Stats ───
router.get(
  '/stats/:propertyId',
  authenticate,
  authorize('provider', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId } = req.params;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = await InventorySlot.aggregate([
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
    } catch (error) {
      next(error);
    }
  }
);

export default router;
