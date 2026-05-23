import Redis from 'ioredis';
import { logger } from '../core/utils/logger';
import env from './environment';

const createRedisClient = (): Redis => {
  const client = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => {
      if (times > 10) {
        logger.error('Redis: Max retry attempts reached');
        return null;
      }
      const delay = Math.min(times * 200, 5000);
      logger.warn(`Redis: Retrying connection in ${delay}ms (attempt ${times})`);
      return delay;
    },
    lazyConnect: false,
    enableReadyCheck: true,
    reconnectOnError: (err: Error) => {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
      return targetErrors.some((e) => err.message.includes(e));
    },
  });

  client.on('connect', () => {
    logger.info('Redis client connected');
  });

  client.on('ready', () => {
    logger.info('Redis client ready');
  });

  client.on('error', (error) => {
    logger.error({ err: error }, 'Redis connection error:');
  });

  client.on('close', () => {
    logger.warn('Redis connection closed');
  });

  return client;
};

// Primary client for general cache operations
export const redisClient = createRedisClient();

// Subscriber client for Pub/Sub (requires separate connection)
export const redisSubscriber = createRedisClient();

// Publisher client for Pub/Sub
export const redisPublisher = createRedisClient();

export default redisClient;
