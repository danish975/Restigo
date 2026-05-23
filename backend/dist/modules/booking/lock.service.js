"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lockService = exports.LockService = void 0;
const uuid_1 = require("uuid");
const redis_1 = require("../../config/redis");
const logger_1 = require("../../core/utils/logger");
const environment_1 = __importDefault(require("../../config/environment"));
/**
 * Redis Distributed Lock Service
 *
 * Implements the single-node Redlock algorithm for distributed locking.
 * Uses atomic SET NX PX for acquisition and Lua script for safe release.
 *
 * Lock lifecycle:
 * 1. Acquire: SET lock:slot:{id} {requestId} NX PX {ttl}
 * 2. Only one process succeeds (NX = set if Not eXists)
 * 3. Release: Lua script checks owner before deleting (prevents releasing someone else's lock)
 * 4. Auto-expire: PX ensures stale locks self-destruct after TTL
 */
class LockService {
    lockPrefix = 'lock:slot:';
    defaultTTL;
    // Lua script: only release if we own the lock (compare value)
    releaseLuaScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
    // Lua script: extend lock TTL if we own it
    extendLuaScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("pexpire", KEYS[1], ARGV[2])
    else
      return 0
    end
  `;
    constructor() {
        this.defaultTTL = environment_1.default.LOCK_TTL_MS; // 10000ms default
    }
    /**
     * Attempt to acquire a distributed lock for a slot
     * Returns lockId on success, null on failure
     */
    async acquireLock(slotId, ttlMs) {
        const lockKey = `${this.lockPrefix}${slotId}`;
        const lockId = (0, uuid_1.v4)();
        const ttl = ttlMs || this.defaultTTL;
        try {
            // Atomic SET NX PX — only one caller wins
            const result = await redis_1.redisClient.set(lockKey, lockId, 'PX', ttl, 'NX');
            if (result === 'OK') {
                logger_1.logger.debug({ slotId, lockId, ttl }, 'Lock acquired');
                return lockId;
            }
            logger_1.logger.debug({ slotId }, 'Lock acquisition failed — slot is locked by another process');
            return null;
        }
        catch (error) {
            logger_1.logger.error({ slotId, error }, 'Lock acquisition error');
            return null;
        }
    }
    /**
     * Release a lock — only if we own it
     * Uses Lua script for atomicity (GET + DEL in single operation)
     */
    async releaseLock(slotId, lockId) {
        const lockKey = `${this.lockPrefix}${slotId}`;
        try {
            const result = await redis_1.redisClient.eval(this.releaseLuaScript, 1, lockKey, lockId);
            const released = result === 1;
            if (released) {
                logger_1.logger.debug({ slotId, lockId }, 'Lock released');
            }
            else {
                logger_1.logger.warn({ slotId, lockId }, 'Lock release failed — not owner or already expired');
            }
            return released;
        }
        catch (error) {
            logger_1.logger.error({ slotId, lockId, error }, 'Lock release error');
            return false;
        }
    }
    /**
     * Extend lock TTL — only if we still own it
     */
    async extendLock(slotId, lockId, additionalTTLMs) {
        const lockKey = `${this.lockPrefix}${slotId}`;
        try {
            const result = await redis_1.redisClient.eval(this.extendLuaScript, 1, lockKey, lockId, additionalTTLMs.toString());
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error({ slotId, lockId, error }, 'Lock extension error');
            return false;
        }
    }
    /**
     * Check if a slot is currently locked
     */
    async isLocked(slotId) {
        const lockKey = `${this.lockPrefix}${slotId}`;
        const exists = await redis_1.redisClient.exists(lockKey);
        return exists === 1;
    }
    /**
     * Get remaining TTL for a lock
     */
    async getLockTTL(slotId) {
        const lockKey = `${this.lockPrefix}${slotId}`;
        return redis_1.redisClient.pttl(lockKey);
    }
}
exports.LockService = LockService;
exports.lockService = new LockService();
//# sourceMappingURL=lock.service.js.map