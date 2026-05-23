import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Property } from './property.model';
import { Room } from '../room/room.model';
import { authenticate, authorize } from '../../core/middleware/auth';
import { validate } from '../../core/middleware/validate';
import { NotFoundError } from '../../core/errors';
import { StatusCodes } from 'http-status-codes';

const router = Router();

const createPropertyDto = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  type: z.enum(['hotel', 'transit_room', 'coworking', 'nap_pod', 'lounge', 'capsule_hotel', 'meeting_room', 'short_stay_apartment']),
  images: z.array(z.string().url()).max(20).default([]),
  location: z.object({
    coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().min(1),
    zipCode: z.string().optional(),
    landmark: z.string().optional(),
  }),
  amenities: z.array(z.string()).default([]),
  policies: z.object({
    cancellationPolicy: z.enum(['flexible', 'moderate', 'strict']).default('moderate'),
    minBookingHours: z.number().int().min(1).default(1),
    maxBookingHours: z.number().int().max(72).default(24),
    allowPets: z.boolean().default(false),
    smokingAllowed: z.boolean().default(false),
  }).default({}),
  contact: z.object({
    phone: z.string().min(1),
    email: z.string().email(),
    website: z.string().url().optional(),
  }),
  priceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
    currency: z.string().default('INR'),
  }),
  operatingHours: z.object({
    open: z.string().default('00:00'),
    close: z.string().default('23:59'),
    is24Hours: z.boolean().default(false),
    closedDays: z.array(z.number().int().min(0).max(6)).default([]),
  }).default({}),
});

// GET /properties — List properties (public)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;

    const filter: any = { status: 'active' };
    if (type) filter.type = type;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .select('name slug type images location rating priceRange amenities operatingHours featured')
        .sort({ featured: -1, 'rating.average': -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Property.countDocuments(filter),
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: { properties, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
    });
  } catch (error) { next(error); }
});

// GET /properties/:slug — Get property detail
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await Property.findOne({ slug: req.params.slug, status: 'active' });
    if (!property) throw new NotFoundError('Property');

    const rooms = await Room.find({ propertyId: property._id, status: 'available', isActive: true })
      .select('name type basePrice currency amenities capacity images size');

    res.status(StatusCodes.OK).json({ success: true, data: { property, rooms } });
  } catch (error) { next(error); }
});

// POST /properties — Create property (provider only)
router.post('/', authenticate, authorize('provider', 'admin'), validate(createPropertyDto), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await Property.create({
      ...req.body,
      providerId: req.user!.userId,
      location: { type: 'Point', ...req.body.location },
    });
    res.status(StatusCodes.CREATED).json({ success: true, data: { property } });
  } catch (error) { next(error); }
});

// PUT /properties/:id — Update property (owner only)
router.put('/:id', authenticate, authorize('provider', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await Property.findOneAndUpdate(
      { _id: req.params.id, providerId: req.user!.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!property) throw new NotFoundError('Property');
    res.status(StatusCodes.OK).json({ success: true, data: { property } });
  } catch (error) { next(error); }
});

// GET /properties/provider/mine — Provider's own properties
router.get('/provider/mine', authenticate, authorize('provider'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const properties = await Property.find({ providerId: req.user!.userId }).sort({ createdAt: -1 });
    res.status(StatusCodes.OK).json({ success: true, data: { properties } });
  } catch (error) { next(error); }
});

export default router;
