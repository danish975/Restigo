import { Router, Request, Response, NextFunction } from 'express';
import { Property } from '../property/property.model';
import { Booking } from '../booking/booking.model';
import { Room } from '../room/room.model';
import { InventorySlot } from '../inventory/inventory-slot.model';
import { authenticate, authorize } from '../../core/middleware/auth';
import { NotFoundError } from '../../core/errors';

const router = Router();

// ─── Provider Dashboard Overview ───
router.get(
  '/overview',
  authenticate,
  authorize('provider', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const providerId = (req as any).user.userId;

      const properties = await Property.find({ providerId });
      const propertyIds = properties.map((p) => p._id);

      const [totalRevenue, activeBookings, totalProperties, totalRooms, upcomingCheckins] = await Promise.all([
        Booking.aggregate([
          { $match: { propertyId: { $in: propertyIds }, status: { $in: ['confirmed', 'completed'] } } },
          { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
        ]),
        Booking.countDocuments({ propertyId: { $in: propertyIds }, status: { $in: ['held', 'confirmed', 'checked_in'] } }),
        Property.countDocuments({ providerId }),
        Room.countDocuments({ propertyId: { $in: propertyIds } }),
        Booking.find({ propertyId: { $in: propertyIds }, status: 'confirmed', 'checkIn.date': { $gte: new Date() } })
          .populate('userId', 'firstName lastName avatar')
          .populate('roomId', 'name')
          .sort({ 'checkIn.date': 1, 'checkIn.time': 1 })
          .limit(5),
      ]);

      res.json({
        success: true,
        data: {
          stats: {
            totalRevenue: totalRevenue[0]?.total || 0,
            activeBookings,
            totalProperties,
            totalRooms,
          },
          upcomingCheckins,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Earnings Analytics ───
router.get(
  '/earnings',
  authenticate,
  authorize('provider', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const providerId = (req as any).user.userId;
      const properties = await Property.find({ providerId });
      const propertyIds = properties.map((p) => p._id);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const earnings = await Booking.aggregate([
        {
          $match: {
            propertyId: { $in: propertyIds },
            status: { $in: ['confirmed', 'completed'] },
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: { $sum: '$pricing.totalAmount' },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.json({ success: true, data: earnings });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
