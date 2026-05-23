"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../core/utils/logger");
const environment_1 = __importDefault(require("./environment"));
const connectDatabase = async () => {
    try {
        mongoose_1.default.set('strictQuery', true);
        const conn = await mongoose_1.default.connect(environment_1.default.MONGODB_URI, {
            maxPoolSize: 10,
            minPoolSize: 2,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 5000,
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            w: 'majority',
        });
        logger_1.logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.logger.error('MongoDB connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.logger.warn('MongoDB disconnected. Attempting reconnection...');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.logger.info('MongoDB reconnected successfully');
        });
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'MongoDB connection error:');
        setTimeout(connectDatabase, 5000);
    }
};
const disconnectDatabase = async () => {
    try {
        await mongoose_1.default.disconnect();
        logger_1.logger.info('MongoDB disconnected gracefully');
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Error during MongoDB disconnect:');
    }
};
exports.disconnectDatabase = disconnectDatabase;
exports.default = connectDatabase;
//# sourceMappingURL=database.js.map