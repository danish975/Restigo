"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_model_1 = require("./notification.model");
const auth_1 = require("../../core/middleware/auth");
const errors_1 = require("../../core/errors");
const router = (0, express_1.Router)();
// ─── Get User Notifications ───
router.get('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const unreadOnly = req.query.unread === 'true';
        const filter = { userId };
        if (unreadOnly)
            filter.read = false;
        const [notifications, total, unreadCount] = await Promise.all([
            notification_model_1.Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            notification_model_1.Notification.countDocuments(filter),
            notification_model_1.Notification.countDocuments({ userId, read: false }),
        ]);
        res.json({
            success: true,
            data: {
                notifications,
                unreadCount,
                pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// ─── Mark Single Notification as Read ───
router.patch('/:notificationId/read', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const notification = await notification_model_1.Notification.findOneAndUpdate({ _id: req.params.notificationId, userId }, { $set: { read: true } }, { new: true });
        if (!notification)
            throw new errors_1.NotFoundError('Notification');
        res.json({ success: true, data: notification });
    }
    catch (error) {
        next(error);
    }
});
// ─── Mark All as Read ───
router.patch('/read-all', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await notification_model_1.Notification.updateMany({ userId, read: false }, { $set: { read: true } });
        res.json({
            success: true,
            data: { modifiedCount: result.modifiedCount },
        });
    }
    catch (error) {
        next(error);
    }
});
// ─── Delete Notification ───
router.delete('/:notificationId', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const notification = await notification_model_1.Notification.findOneAndDelete({
            _id: req.params.notificationId,
            userId,
        });
        if (!notification)
            throw new errors_1.NotFoundError('Notification');
        res.json({ success: true, message: 'Notification deleted' });
    }
    catch (error) {
        next(error);
    }
});
// ─── Clear All Notifications ───
router.delete('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await notification_model_1.Notification.deleteMany({ userId });
        res.json({
            success: true,
            data: { deletedCount: result.deletedCount },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=notification.routes.js.map