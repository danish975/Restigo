import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Property } from '../property/property.model';
import { InventorySlot } from '../inventory/inventory-slot.model';
import { getRedisClient } from '../../config/redis';
import { validate } from '../../core/middleware/validate';
import { optionalAuth } from '../../core/middleware/auth';
import { logger } from '../../core/utils/logger';
import { StatusCodes } from 'http-status-codes';

const router = Router();

const searchQueryDto = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(0.5).max(100).default(10), // km
  type: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  amenities: z.string().optional(), // comma-separated
  rating: z.coerce.number().min(0).max(5).optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.coerce.number().min(30).optional(),
  sortBy: z.enum(['distance', 'price_low', 'price_high', 'rating']).default('distance'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  city: z.string().optional(),
  q: z.string().optional(), // text search
});

// GET /search — Search properties with geo + filters
router.get('/', optionalAuth, validate(searchQueryDto, 'query'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query as any;
    const page = q.page || 1;
    const limit = q.limit || 20;

    // Build cache key
    const redis = getRedisClient();
    const cacheKey = `search:${JSON.stringify(q)}`;
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.status(StatusCodes.OK).json({ success: true, data: JSON.parse(cached), _cached: true });
        return;
      }
    }

    // Build aggregation pipeline
    const pipeline: any[] = [];

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
    } else {
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
      const priceMatch: any = {};
      if (q.minPrice) priceMatch['priceRange.min'] = { $gte: parseFloat(q.minPrice) };
      if (q.maxPrice) priceMatch['priceRange.max'] = { $lte: parseFloat(q.maxPrice) };
      pipeline.push({ $match: priceMatch });
    }

    // Amenities filter
    if (q.amenities) {
      const amenityList = q.amenities.split(',').map((a: string) => a.trim());
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
    const sortStage: any = {};
    switch (q.sortBy) {
      case 'price_low': sortStage['priceRange.min'] = 1; break;
      case 'price_high': sortStage['priceRange.max'] = -1; break;
      case 'rating': sortStage['rating.average'] = -1; break;
      default: if (q.lat && q.lng) sortStage.distance = 1; else sortStage['rating.average'] = -1;
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
      Property.aggregate(pipeline),
      Property.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;
    const data = {
      properties: results,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };

    // Cache for 30 seconds
    if (redis) {
      await redis.setex(cacheKey, 30, JSON.stringify(data));
    }

    res.status(StatusCodes.OK).json({ success: true, data });
  } catch (error) { next(error); }
});

// GET /search/slots — Search available slots for a property
router.get('/slots', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { propertyId, roomId, date, startTime, endTime } = req.query;
    if (!propertyId) {
      res.status(400).json({ success: false, error: { message: 'propertyId is required' } });
      return;
    }

    const filter: any = { propertyId, status: { $in: ['available', 'held', 'booked'] } };
    if (roomId) filter.roomId = roomId;
    if (date) {
      const dateStr = date as string;
      const [year, month, day] = dateStr.split('-').map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
      filter.date = { $gte: startOfDay, $lt: endOfDay };
    }
    if (startTime) filter.startTime = { $gte: startTime };
    if (endTime) filter.endTime = { $lte: endTime };

    const slots = await InventorySlot.find(filter)
      .populate('roomId', 'name type basePrice amenities capacity')
      .sort({ startTime: 1 });

    res.status(StatusCodes.OK).json({ success: true, data: { slots } });
  } catch (error) { next(error); }
});

export default router;
