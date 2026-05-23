"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisPublisher = exports.redisSubscriber = exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../core/utils/logger");
const environment_1 = __importDefault(require("./environment"));
const createRedisClient = () => {
    const client = new ioredis_1.default({
        host: environment_1.default.REDIS_HOST,
        port: environment_1.default.REDIS_PORT,
        password: environment_1.default.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
        retryStrategy: (times) => {
            if (times > 10) {
                logger_1.logger.error('Redis: Max retry attempts reached');
                return null;
            }
            const delay = Math.min(times * 200, 5000);
            logger_1.logger.warn(`Redis: Retrying connection in ${delay}ms (attempt ${times})`);
            return delay;
        },
        lazyConnect: false,
        enableReadyCheck: true,
        reconnectOnError: (err) => {
            const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
            return targetErrors.some((e) => err.message.includes(e));
        },
    });
    client.on('connect', () => {
        logger_1.logger.info('Redis client connected');
    });
    client.on('ready', () => {
        logger_1.logger.info('Redis client ready');
    });
    client.on('error', (error) => {
        logger_1.logger.error({ err: error }, 'Redis connection error:');
    });
    client.on('close', () => {
        logger_1.logger.warn('Redis connection closed');
    });
    return client;
};
// Primary client for general cache operations
exports.redisClient = createRedisClient();
// Subscriber client for Pub/Sub (requires separate connection)
exports.redisSubscriber = createRedisClient();
// Publisher client for Pub/Sub
exports.redisPublisher = createRedisClient();
exports.default = exports.redisClient;
//# sourceMappingURL=redis.js.map