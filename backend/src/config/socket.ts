import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../core/utils/logger';
import { getRedisPublisher, getRedisSubscriber, isRedisAvailable } from './redis';
import env from './environment';

let io: Server;

export const initializeSocketIO = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // Middleware: authenticate socket connections
  io.use(async (socket: Socket, next) => {
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
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join room for property-specific inventory updates
    socket.on('join:property', (propertyId: string) => {
      socket.join(`property:${propertyId}`);
      logger.debug(`Socket ${socket.id} joined property:${propertyId}`);
    });

    socket.on('leave:property', (propertyId: string) => {
      socket.leave(`property:${propertyId}`);
      logger.debug(`Socket ${socket.id} left property:${propertyId}`);
    });

    // Join room for user-specific notifications
    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      logger.debug(`Socket ${socket.id} joined user:${userId}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error({ err: error }, `Error publishing to ${socket.id}:`);
    });
  });

  // Subscribe to Redis channels for cross-instance communication (only if Redis available)
  if (isRedisAvailable()) {
    setupRedisSubscriptions();
  } else {
    logger.warn('Socket.IO: Redis pub/sub disabled (Redis unavailable)');
  }

  logger.info('Socket.IO server initialized');
  return io;
};

const setupRedisSubscriptions = (): void => {
  const subscriber = getRedisSubscriber();
  if (!subscriber) return;

  subscriber.subscribe(
    'inventory:update',
    'booking:update',
    'notification:push',
    (err, count) => {
      subscriber.on('error', (error) => {
        logger.error({ err: error }, 'Redis subscribe error:');
      });
      if (err) {
        return;
      }
      logger.info(`Subscribed to ${count} Redis channels`);
    }
  );

  subscriber.on('message', (channel: string, message: string) => {
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
          logger.warn(`Unhandled Redis channel: ${channel}`);
      }
    } catch (error) {
      logger.error({ err: error }, `Failed to process message on channel ${channel}:`);
    }
  });
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Helper to broadcast inventory changes
export const broadcastInventoryUpdate = async (
  propertyId: string,
  slotId: string,
  status: string,
  data?: Record<string, unknown>
): Promise<void> => {
  const payload = { propertyId, slotId, status, ...data, timestamp: Date.now() };
  const publisher = getRedisPublisher();
  if (publisher) {
    await publisher.publish('inventory:update', JSON.stringify(payload));
  } else {
    // Fallback: emit directly (single-instance only)
    io?.to(`property:${propertyId}`).emit('slot:updated', payload);
  }
};

// Helper to send user notification
export const sendUserNotification = async (
  userId: string,
  notification: { type: string; title: string; message: string; data?: Record<string, unknown> }
): Promise<void> => {
  const payload = { userId, ...notification, timestamp: Date.now() };
  const publisher = getRedisPublisher();
  if (publisher) {
    await publisher.publish('notification:push', JSON.stringify(payload));
  } else {
    // Fallback: emit directly (single-instance only)
    io?.to(`user:${userId}`).emit('notification', payload);
  }
};

export default { initializeSocketIO, getIO, broadcastInventoryUpdate, sendUserNotification };
