"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationWorker = void 0;
const bullmq_1 = require("bullmq");
const logger_1 = require("../../core/utils/logger");
const environment_1 = __importDefault(require("../../config/environment"));
const redisConnection = {
    host: environment_1.default.REDIS_HOST,
    port: environment_1.default.REDIS_PORT,
    password: environment_1.default.REDIS_PASSWORD || undefined,
};
exports.notificationWorker = new bullmq_1.Worker('notification', async (job) => {
    logger_1.logger.info({ type: job.name, data: job.data }, 'Processing notification job');
    try {
        // In a real scenario, integrate with SendGrid, Twilio, etc. here.
        // Mock processing for now.
        await new Promise(resolve => setTimeout(resolve, 500));
        logger_1.logger.info('Notification processed successfully');
        return { status: 'delivered' };
    }
    catch (error) {
        logger_1.logger.error({ error, jobId: job.id }, 'Notification job failed');
        throw error;
    }
}, { connection: redisConnection, concurrency: 20 });
exports.notificationWorker.on('failed', (job, err) => {
    logger_1.logger.error({ jobId: job?.id, error: err }, 'Notification worker job failed');
});
//# sourceMappingURL=notification.worker.js.map