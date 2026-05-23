import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Room } from './room.model';
import { InventorySlot } from '../inventory/inventory-slot.model';
import { Property } from '../property/property.model';
import { authenticate, authorize } from '../../core/middleware/auth';
import { validate } from '../../core/middleware/validate';
import { NotFoundError, ForbiddenError } from '../../core/errors';
import { StatusCodes } from 'http-status-codes';

const router = Router();

const createRoomDto = z.object({
  propertyId: z.string(),
  name: z.string().min(1).max(100),
  type: z.enum(['standard','deluxe','suite','pod','capsule','desk','meeting_room','private_office','lounge_seat']),
  description: z.string().max(2000).optional(),
  images: z.array(z.string()).max(10).default([]),
  floor: z.number().int().default(1),
  roomNumber: z.string().min(1),
  capacity: z.object({ adults: z.number().int().min(1).default(1), children: z.number().int().min(0).default(0) }),
  basePrice: z.number().min(0),
  currency: z.string().default('INR'),
  amenities: z.array(z.string()).default([]),
  size: z.object({ value: z.number().min(0), unit: z.enum(['sqft', 'sqm']).default('sqft') }).optional(),
  bedConfiguration: z.string().optional(),
});

const generateSlotsDto = z.object({
  roomId: z.string(),
  date: z.string(), // YYYY-MM-DD
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(1).max(24),
  slotDurationMinutes: z.number().int().min(30).max(480).default(60),
  pricePerSlot: z.number().min(0).optional(),
});

// POST /rooms — Create room
router.post('/', authenticate, authorize('provider', 'admin'), validate(createRoomDto), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await Property.findOne({ _id: req.body.propertyId, providerId: req.user!.userId });
    if (!property) throw new ForbiddenError('Not authorized to add rooms to this property');

    const room = await Room.create(req.body);
    await Property.findByIdAndUpdate(property._id, { $inc: { totalRooms: 1 } });
    res.status(StatusCodes.CREATED).json({ success: true, data: { room } });
  } catch (error) { next(error); }
});

// POST /rooms/generate-slots — Auto-generate inventory slots for a room
router.post('/generate-slots', authenticate, authorize('provider', 'admin'), validate(generateSlotsDto), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId, date, startHour, endHour, slotDurationMinutes, pricePerSlot } = req.body;
    const room = await Room.findById(roomId).populate('propertyId');
    if (!room) throw new NotFoundError('Room');

    const property = await Property.findOne({ _id: room.propertyId, providerId: req.user!.userId });
    if (!property) throw new ForbiddenError('Not authorized');

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

    const created = await InventorySlot.insertMany(slots, { ordered: false }).catch((err) => {
      // Handle duplicate key errors gracefully (slots already exist)
      if (err.code === 11000) return err.insertedDocs || [];
      throw err;
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: { slotsCreated: Array.isArray(created) ? created.length : 0, slots: created },
    });
  } catch (error) { next(error); }
});

// GET /rooms/:propertyId — Get rooms for a property
router.get('/:propertyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rooms = await Room.find({ propertyId: req.params.propertyId, isActive: true }).sort({ type: 1, roomNumber: 1 });
    res.status(StatusCodes.OK).json({ success: true, data: { rooms } });
  } catch (error) { next(error); }
});

export default router;
