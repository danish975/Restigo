import { Worker, Job } from 'bullmq';
import { logger } from '../../core/utils/logger';
import env from '../../config/environment';

const redisConnection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
};

export const notificationWorker = new Worker(
  'notification',
  async (job: Job) => {
    logger.info({ type: job.name, data: job.data }, 'Processing notification job');

    try {
      // In a real scenario, integrate with SendGrid, Twilio, etc. here.
      // Mock processing for now.
      await new Promise(resolve => setTimeout(resolve, 500));
      logger.info('Notification processed successfully');
      return { status: 'delivered' };
    } catch (error) {
      logger.error({ error, jobId: job.id }, 'Notification job failed');
      throw error;
    }
  },
  { connection: redisConnection, concurrency: 20 }
);

notificationWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, 'Notification worker job failed');
});
