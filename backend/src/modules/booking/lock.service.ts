import { v4 as uuidv4 } from 'uuid';
import { redisClient } from '../../config/redis';
import { logger } from '../../core/utils/logger';
import env from '../../config/environment';

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
export class LockService {
  private readonly lockPrefix = 'lock:slot:';
  private readonly defaultTTL: number;

  // Lua script: only release if we own the lock (compare value)
  private readonly releaseLuaScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  // Lua script: extend lock TTL if we own it
  private readonly extendLuaScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("pexpire", KEYS[1], ARGV[2])
    else
      return 0
    end
  `;

  constructor() {
    this.defaultTTL = env.LOCK_TTL_MS; // 10000ms default
  }

  /**
   * Attempt to acquire a distributed lock for a slot
   * Returns lockId on success, null on failure
   */
  async acquireLock(slotId: string, ttlMs?: number): Promise<string | null> {
    const lockKey = `${this.lockPrefix}${slotId}`;
    const lockId = uuidv4();
    const ttl = ttlMs || this.defaultTTL;

    try {
      // Atomic SET NX PX — only one caller wins
      const result = await redisClient.set(lockKey, lockId, 'PX', ttl, 'NX');

      if (result === 'OK') {
        logger.debug({ slotId, lockId, ttl }, 'Lock acquired');
        return lockId;
      }

      logger.debug({ slotId }, 'Lock acquisition failed — slot is locked by another process');
      return null;
    } catch (error) {
      logger.error({ slotId, error }, 'Lock acquisition error');
      return null;
    }
  }

  /**
   * Release a lock — only if we own it
   * Uses Lua script for atomicity (GET + DEL in single operation)
   */
  async releaseLock(slotId: string, lockId: string): Promise<boolean> {
    const lockKey = `${this.lockPrefix}${slotId}`;

    try {
      const result = await redisClient.eval(
        this.releaseLuaScript,
        1,
        lockKey,
        lockId
      );

      const released = result === 1;
      if (released) {
        logger.debug({ slotId, lockId }, 'Lock released');
      } else {
        logger.warn({ slotId, lockId }, 'Lock release failed — not owner or already expired');
      }
      return released;
    } catch (error) {
      logger.error({ slotId, lockId, error }, 'Lock release error');
      return false;
    }
  }

  /**
   * Extend lock TTL — only if we still own it
   */
  async extendLock(slotId: string, lockId: string, additionalTTLMs: number): Promise<boolean> {
    const lockKey = `${this.lockPrefix}${slotId}`;

    try {
      const result = await redisClient.eval(
        this.extendLuaScript,
        1,
        lockKey,
        lockId,
        additionalTTLMs.toString()
      );
      return result === 1;
    } catch (error) {
      logger.error({ slotId, lockId, error }, 'Lock extension error');
      return false;
    }
  }

  /**
   * Check if a slot is currently locked
   */
  async isLocked(slotId: string): Promise<boolean> {
    const lockKey = `${this.lockPrefix}${slotId}`;
    const exists = await redisClient.exists(lockKey);
    return exists === 1;
  }

  /**
   * Get remaining TTL for a lock
   */
  async getLockTTL(slotId: string): Promise<number> {
    const lockKey = `${this.lockPrefix}${slotId}`;
    return redisClient.pttl(lockKey);
  }
}

export const lockService = new LockService();
