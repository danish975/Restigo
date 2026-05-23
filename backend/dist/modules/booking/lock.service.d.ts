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
export declare class LockService {
    private readonly lockPrefix;
    private readonly defaultTTL;
    private readonly releaseLuaScript;
    private readonly extendLuaScript;
    constructor();
    /**
     * Attempt to acquire a distributed lock for a slot
     * Returns lockId on success, null on failure
     */
    acquireLock(slotId: string, ttlMs?: number): Promise<string | null>;
    /**
     * Release a lock — only if we own it
     * Uses Lua script for atomicity (GET + DEL in single operation)
     */
    releaseLock(slotId: string, lockId: string): Promise<boolean>;
    /**
     * Extend lock TTL — only if we still own it
     */
    extendLock(slotId: string, lockId: string, additionalTTLMs: number): Promise<boolean>;
    /**
     * Check if a slot is currently locked
     */
    isLocked(slotId: string): Promise<boolean>;
    /**
     * Get remaining TTL for a lock
     */
    getLockTTL(slotId: string): Promise<number>;
}
export declare const lockService: LockService;
//# sourceMappingURL=lock.service.d.ts.map