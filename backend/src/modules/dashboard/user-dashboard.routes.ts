import { Router, Request, Response, NextFunction } from 'express';
import { Booking } from '../booking/booking.model';
import { Notification } from '../notification/notification.model';
import { authenticate } from '../../core/middleware/auth';

const router = Router();

router.get(
  '/overview',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;

      const [totalBookings, activeBookings, completedBookings, cancelledBookings, totalSpent, unreadNotifications, recentBookings] = await Promise.all([
        Booking.countDocuments({ userId }),
        Booking.countDocuments({ userId, status: { $in: ['held', 'confirmed', 'checked_in'] } }),
        Booking.countDocuments({ userId, status: 'completed' }),
        Booking.countDocuments({ userId, status: 'cancelled' }),
        Booking.aggregate([
          { $match: { userId: new (require('mongoose').Types.ObjectId)(userId), status: { $in: ['confirmed', 'completed'] } } },
          { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
        ]),
        Notification.countDocuments({ userId, read: false }),
        Booking.find({ userId }).populate('propertyId', 'name type images location').populate('roomId', 'name type').sort({ createdAt: -1 }).limit(5),
      ]);

      res.json({
        success: true,
        data: {
          stats: { totalBookings, activeBookings, completedBookings, cancelledBookings, totalSpent: totalSpent[0]?.total || 0, unreadNotifications },
          recentBookings,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/bookings', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const filter: any = { userId };
    if (status) filter.status = status;

    const [bookings, total] = await Promise.all([
      Booking.find(filter).populate('propertyId', 'name type images location rating').populate('roomId', 'name type amenities').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Booking.countDocuments(filter),
    ]);

    res.json({ success: true, data: { bookings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
  } catch (error) {
    next(error);
  }
});

router.get('/spending', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const spending = await Booking.aggregate([
      { $match: { userId: new (require('mongoose').Types.ObjectId)(userId), status: { $in: ['confirmed', 'completed'] }, createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$pricing.totalAmount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data: spending });
  } catch (error) {
    next(error);
  }
});

export default router;
