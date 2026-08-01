import Redis from 'ioredis';
import { logger } from '../core/utils/logger';
import env from './environment';

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;
let redisPublisher: Redis | null = null;
let redisAvailable = false;

const createRedisClient = (label: string): Redis => {
  const client = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => {
      if (times > 3) {
        logger.warn(`Redis (${label}): Max retry attempts reached, giving up`);
        return null;
      }
      const delay = Math.min(times * 200, 2000);
      logger.warn(`Redis (${label}): Retrying connection in ${delay}ms (attempt ${times})`);
      return delay;
    },
    lazyConnect: true,
    enableReadyCheck: true,
    reconnectOnError: (err: Error) => {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
      return targetErrors.some((e) => err.message.includes(e));
    },
  });

  client.on('connect', () => {
    logger.info(`Redis (${label}) client connected`);
  });

  client.on('ready', () => {
    logger.info(`Redis (${label}) client ready`);
  });

  client.on('error', (error) => {
    logger.error({ err: error }, `Redis (${label}) connection error:`);
  });

  client.on('close', () => {
    logger.warn(`Redis (${label}) connection closed`);
  });

  return client;
};

export const connectRedis = async (): Promise<boolean> => {
  try {
    redisClient = createRedisClient('primary');
    redisSubscriber = createRedisClient('subscriber');
    redisPublisher = createRedisClient('publisher');

    await redisClient.connect();
    await redisClient.ping();
    await redisSubscriber.connect();
    await redisPublisher.connect();

    redisAvailable = true;
    logger.info('All Redis connections established');
    return true;
  } catch (error) {
    logger.warn('Redis is not available — running without Redis (caching, queues, and pub/sub disabled)');
    // Clean up any partially connected clients
    try { redisClient?.disconnect(); } catch { /* ignore */ }
    try { redisSubscriber?.disconnect(); } catch { /* ignore */ }
    try { redisPublisher?.disconnect(); } catch { /* ignore */ }
    redisClient = null;
    redisSubscriber = null;
    redisPublisher = null;
    redisAvailable = false;
    return false;
  }
};

export const isRedisAvailable = (): boolean => redisAvailable;

export const getRedisClient = (): Redis | null => redisClient;
export const getRedisSubscriber = (): Redis | null => redisSubscriber;
export const getRedisPublisher = (): Redis | null => redisPublisher;

export { redisClient, redisSubscriber, redisPublisher };
export default redisClient;
