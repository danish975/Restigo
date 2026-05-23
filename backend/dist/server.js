"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const database_1 = __importStar(require("./config/database"));
const socket_1 = require("./config/socket");
const bull_1 = require("./config/bull");
const redis_1 = require("./config/redis");
const logger_1 = require("./core/utils/logger");
const environment_1 = __importDefault(require("./config/environment"));
const startServer = async () => {
    try {
        // Connect to MongoDB
        await (0, database_1.default)();
        logger_1.logger.info('Database connection established');
        // Verify Redis connection
        await redis_1.redisClient.ping();
        logger_1.logger.info('Redis connection verified');
        // Create HTTP server
        const server = http_1.default.createServer(app_1.default);
        // Initialize Socket.IO
        (0, socket_1.initializeSocketIO)(server);
        logger_1.logger.info('Socket.IO initialized');
        // Initialize BullMQ queues
        await (0, bull_1.initializeQueues)();
        logger_1.logger.info('BullMQ queues initialized');
        // Start listening
        server.listen(environment_1.default.PORT, () => {
            logger_1.logger.info(`🚀 RESTIGO API Server running on port ${environment_1.default.PORT}`);
            logger_1.logger.info(`📍 Environment: ${environment_1.default.NODE_ENV}`);
            logger_1.logger.info(`🔗 Health check: http://localhost:${environment_1.default.PORT}/health`);
            logger_1.logger.info(`📡 API base: http://localhost:${environment_1.default.PORT}/api/${environment_1.default.API_VERSION}`);
        });
        // ─── Graceful Shutdown ───
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info(`${signal} received. Starting graceful shutdown...`);
            server.close(async () => {
                logger_1.logger.info('HTTP server closed');
                try {
                    await (0, database_1.disconnectDatabase)();
                    await redis_1.redisClient.quit();
                    logger_1.logger.info('All connections closed. Exiting.');
                    process.exit(0);
                }
                catch (error) {
                    logger_1.logger.error({ err: error }, 'Error during shutdown:');
                    process.exit(1);
                }
            });
            // Force exit after 30 seconds
            setTimeout(() => {
                logger_1.logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 30000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        // Handle unhandled rejections
        process.on('unhandledRejection', (reason) => {
            logger_1.logger.error({ err: reason }, 'Unhandled Rejection:');
            gracefulShutdown('unhandledRejection');
        });
        process.on('uncaughtException', (error) => {
            logger_1.logger.error({ err: error }, 'Uncaught Exception:');
            gracefulShutdown('uncaughtException');
        });
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Failed to start server:');
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map