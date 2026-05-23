"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueueConnection = exports.initializeQueues = exports.analyticsQueue = exports.mlUpdateQueue = exports.paymentReconciliationQueue = exports.notificationQueue = exports.bookingExpirationQueue = void 0;
const bullmq_1 = require("bullmq");
const logger_1 = require("../core/utils/logger");
const environment_1 = __importDefault(require("./environment"));
const redisConnection = {
    host: environment_1.default.REDIS_HOST,
    port: environment_1.default.REDIS_PORT,
    password: environment_1.default.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
};
// Queue definitions
exports.bookingExpirationQueue = new bullmq_1.Queue('booking-expiration', {
    connection: redisConnection,
    defaultJobOptions: {
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
    },
});
exports.notificationQueue = new bullmq_1.Queue('notifications', {
    connection: redisConnection,
    defaultJobOptions: {
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 2000 },
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
    },
});
exports.paymentReconciliationQueue = new bullmq_1.Queue('payment-reconciliation', {
    connection: redisConnection,
    defaultJobOptions: {
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 1000 },
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
    },
});
exports.mlUpdateQueue = new bullmq_1.Queue('ml-updates', {
    connection: redisConnection,
    defaultJobOptions: {
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
        attempts: 2,
        backoff: { type: 'exponential', delay: 10000 },
    },
});
exports.analyticsQueue = new bullmq_1.Queue('analytics', {
    connection: redisConnection,
    defaultJobOptions: {
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 2000 },
        attempts: 2,
        backoff: { type: 'fixed', delay: 3000 },
    },
});
// Initialize all queues
const initializeQueues = async () => {
    try {
        // Add recurring jobs
        await exports.bookingExpirationQueue.add('cleanup-expired-holds', {}, { repeat: { every: 60000 } } // Every minute
        );
        await exports.paymentReconciliationQueue.add('reconcile-payments', {}, { repeat: { every: 300000 } } // Every 5 minutes
        );
        await exports.mlUpdateQueue.add('refresh-pricing-cache', {}, { repeat: { every: 900000 } } // Every 15 minutes
        );
        logger_1.logger.info('BullMQ queues initialized with recurring jobs');
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Failed to initialize BullMQ queues:');
    }
};
exports.initializeQueues = initializeQueues;
const getQueueConnection = () => redisConnection;
exports.getQueueConnection = getQueueConnection;
//# sourceMappingURL=bull.js.map