import { Router, Request, Response, NextFunction } from 'express';
import { Notification } from './notification.model';
import { authenticate } from '../../core/middleware/auth';
import { NotFoundError } from '../../core/errors';

const router = Router();

// ─── Get User Notifications ───
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const unreadOnly = req.query.unread === 'true';

      const filter: any = { userId };
      if (unreadOnly) filter.read = false;

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Notification.countDocuments(filter),
        Notification.countDocuments({ userId, read: false }),
      ]);

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Mark Single Notification as Read ───
router.patch(
  '/:notificationId/read',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.notificationId, userId },
        { $set: { read: true } },
        { new: true }
      );

      if (!notification) throw new NotFoundError('Notification');
      res.json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Mark All as Read ───
router.patch(
  '/read-all',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const result = await Notification.updateMany(
        { userId, read: false },
        { $set: { read: true } }
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

// ─── Delete Notification ───
router.delete(
  '/:notificationId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const notification = await Notification.findOneAndDelete({
        _id: req.params.notificationId,
        userId,
      });

      if (!notification) throw new NotFoundError('Notification');
      res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Clear All Notifications ───
router.delete(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const result = await Notification.deleteMany({ userId });
      res.json({
        success: true,
        data: { deletedCount: result.deletedCount },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
