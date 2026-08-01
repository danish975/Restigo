import { Queue } from 'bullmq';
import { logger } from '../core/utils/logger';
import { isRedisAvailable } from './redis';
import env from './environment';

const redisConnection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
};

// Lazy queue creation — only instantiate when Redis is available
let bookingExpirationQueue: Queue | null = null;
let notificationQueue: Queue | null = null;
let paymentReconciliationQueue: Queue | null = null;
let mlUpdateQueue: Queue | null = null;
let analyticsQueue: Queue | null = null;

const createQueues = () => {
  bookingExpirationQueue = new Queue('booking-expiration', {
    connection: redisConnection,
    defaultJobOptions: {
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    },
  });

  notificationQueue = new Queue('notifications', {
    connection: redisConnection,
    defaultJobOptions: {
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 2000 },
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    },
  });

  paymentReconciliationQueue = new Queue('payment-reconciliation', {
    connection: redisConnection,
    defaultJobOptions: {
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 1000 },
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
    },
  });

  mlUpdateQueue = new Queue('ml-updates', {
    connection: redisConnection,
    defaultJobOptions: {
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
      attempts: 2,
      backoff: { type: 'exponential', delay: 10000 },
    },
  });

  analyticsQueue = new Queue('analytics', {
    connection: redisConnection,
    defaultJobOptions: {
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 2000 },
      attempts: 2,
      backoff: { type: 'fixed', delay: 3000 },
    },
  });
};

// Initialize all queues
export const initializeQueues = async (): Promise<void> => {
  if (!isRedisAvailable()) {
    logger.warn('BullMQ queues not initialized (Redis unavailable)');
    return;
  }

  try {
    createQueues();

    // Add recurring jobs
    await bookingExpirationQueue!.add(
      'cleanup-expired-holds',
      {},
      { repeat: { every: 60000 } } // Every minute
    );

    await paymentReconciliationQueue!.add(
      'reconcile-payments',
      {},
      { repeat: { every: 300000 } } // Every 5 minutes
    );

    await mlUpdateQueue!.add(
      'refresh-pricing-cache',
      {},
      { repeat: { every: 900000 } } // Every 15 minutes
    );

    logger.info('BullMQ queues initialized with recurring jobs');
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize BullMQ queues:');
  }
};

export const getQueueConnection = () => redisConnection;
export { bookingExpirationQueue, notificationQueue, paymentReconciliationQueue, mlUpdateQueue, analyticsQueue };
