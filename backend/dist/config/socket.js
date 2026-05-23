"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendUserNotification = exports.broadcastInventoryUpdate = exports.getIO = exports.initializeSocketIO = void 0;
const socket_io_1 = require("socket.io");
const logger_1 = require("../core/utils/logger");
const redis_1 = require("./redis");
const environment_1 = __importDefault(require("./environment"));
let io;
const initializeSocketIO = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: environment_1.default.FRONTEND_URL,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
        transports: ['websocket', 'polling'],
    });
    // Middleware: authenticate socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
            if (!token) {
                // Allow unauthenticated connections for public inventory updates
                socket.data.userId = null;
                return next();
            }
            // Token verification will be handled by auth module
            socket.data.token = token;
            next();
        }
        catch (error) {
            next(new Error('Authentication failed'));
        }
    });
    io.on('connection', (socket) => {
        logger_1.logger.info(`Socket connected: ${socket.id}`);
        // Join room for property-specific inventory updates
        socket.on('join:property', (propertyId) => {
            socket.join(`property:${propertyId}`);
            logger_1.logger.debug(`Socket ${socket.id} joined property:${propertyId}`);
        });
        socket.on('leave:property', (propertyId) => {
            socket.leave(`property:${propertyId}`);
            logger_1.logger.debug(`Socket ${socket.id} left property:${propertyId}`);
        });
        // Join room for user-specific notifications
        socket.on('join:user', (userId) => {
            socket.join(`user:${userId}`);
            logger_1.logger.debug(`Socket ${socket.id} joined user:${userId}`);
        });
        socket.on('disconnect', (reason) => {
            logger_1.logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
        });
        socket.on('error', (error) => {
            logger_1.logger.error({ err: error }, `Error publishing to ${socket.id}:`);
        });
    });
    // Subscribe to Redis channels for cross-instance communication
    setupRedisSubscriptions();
    logger_1.logger.info('Socket.IO server initialized');
    return io;
};
exports.initializeSocketIO = initializeSocketIO;
const setupRedisSubscriptions = () => {
    redis_1.redisSubscriber.subscribe('inventory:update', 'booking:update', 'notification:push', (err, count) => {
        redis_1.redisSubscriber.on('error', (error) => {
            logger_1.logger.error({ err: error }, 'Redis subscribe error:');
        });
        if (err) {
            return;
        }
        logger_1.logger.info(`Subscribed to ${count} Redis channels`);
    });
    redis_1.redisSubscriber.on('message', (channel, message) => {
        try {
            const data = JSON.parse(message);
            switch (channel) {
                case 'inventory:update':
                    io.to(`property:${data.propertyId}`).emit('slot:updated', data);
                    break;
                case 'booking:update':
                    io.to(`user:${data.userId}`).emit('booking:updated', data);
                    break;
                case 'notification:push':
                    io.to(`user:${data.userId}`).emit('notification', data);
                    break;
                default:
                    logger_1.logger.warn(`Unhandled Redis channel: ${channel}`);
            }
        }
        catch (error) {
            logger_1.logger.error({ err: error }, `Failed to process message on channel ${channel}:`);
        }
    });
};
const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
};
exports.getIO = getIO;
// Helper to broadcast inventory changes
const broadcastInventoryUpdate = async (propertyId, slotId, status, data) => {
    const payload = { propertyId, slotId, status, ...data, timestamp: Date.now() };
    await redis_1.redisPublisher.publish('inventory:update', JSON.stringify(payload));
};
exports.broadcastInventoryUpdate = broadcastInventoryUpdate;
// Helper to send user notification
const sendUserNotification = async (userId, notification) => {
    const payload = { userId, ...notification, timestamp: Date.now() };
    await redis_1.redisPublisher.publish('notification:push', JSON.stringify(payload));
};
exports.sendUserNotification = sendUserNotification;
exports.default = { initializeSocketIO: exports.initializeSocketIO, getIO: exports.getIO, broadcastInventoryUpdate: exports.broadcastInventoryUpdate, sendUserNotification: exports.sendUserNotification };
//# sourceMappingURL=socket.js.map