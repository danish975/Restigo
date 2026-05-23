import http from 'http';
import app from './app';
import connectDatabase, { disconnectDatabase } from './config/database';
import { initializeSocketIO } from './config/socket';
import { initializeQueues } from './config/bull';
import { redisClient } from './config/redis';
import { logger } from './core/utils/logger';
import env from './config/environment';

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    logger.info('Database connection established');

    // Verify Redis connection
    await redisClient.ping();
    logger.info('Redis connection verified');

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO
    initializeSocketIO(server);
    logger.info('Socket.IO initialized');

    // Initialize BullMQ queues
    await initializeQueues();
    logger.info('BullMQ queues initialized');

    // Start listening
    server.listen(env.PORT, () => {
      logger.info(`🚀 RESTIGO API Server running on port ${env.PORT}`);
      logger.info(`📍 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${env.PORT}/health`);
      logger.info(`📡 API base: http://localhost:${env.PORT}/api/${env.API_VERSION}`);
    });

    // ─── Graceful Shutdown ───
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await disconnectDatabase();
          await redisClient.quit();
          logger.info('All connections closed. Exiting.');
          process.exit(0);
        } catch (error) {
          logger.error({ err: error }, 'Error during shutdown:');
          process.exit(1);
        }
      });

      // Force exit after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error({ err: reason }, 'Unhandled Rejection:');
      gracefulShutdown('unhandledRejection');
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error({ err: error }, 'Uncaught Exception:');
      gracefulShutdown('uncaughtException');
    });

  } catch (error) {
    logger.error({ err: error }, 'Failed to start server:');
    process.exit(1);
  }
};

startServer();
