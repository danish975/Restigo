import { Router, Request, Response, NextFunction } from 'express';
import { User } from '../auth/auth.model';
import { Property } from '../property/property.model';
import { Booking } from '../booking/booking.model';
import { Payment } from '../payment/payment.model';
import { authenticate, authorize } from '../../core/middleware/auth';

const router = Router();

router.get(
  '/overview',
  authenticate,
  authorize('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [totalUsers, totalProviders, totalProperties, totalBookings, revenueData, recentBookings] = await Promise.all([
        User.countDocuments({ role: 'user' }),
        User.countDocuments({ role: 'provider' }),
        Property.countDocuments(),
        Booking.countDocuments(),
        Payment.aggregate([
          { $match: { status: 'succeeded' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Booking.find()
          .populate('userId', 'firstName lastName')
          .populate('propertyId', 'name')
          .sort({ createdAt: -1 })
          .limit(10),
      ]);

      res.json({
        success: true,
        data: {
          stats: {
            totalUsers,
            totalProviders,
            totalProperties,
            totalBookings,
            totalRevenue: revenueData[0]?.total || 0,
          },
          recentBookings,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
