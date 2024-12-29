export interface ResourcePool {
  available: number;
  total: number;
  lastRefill: number;
}

export interface ResourceLimits {
  maxConcurrent: number;
  rateLimit: number;
  poolSize?: number;
}

export const DEFAULT_LIMITS: ResourceLimits = {
  maxConcurrent: 3,
  rateLimit: 30,
  poolSize: 10
};

export class ResourcePoolManager {
  private pools: Map<string, ResourcePool> = new Map();
  
  async initializePool(functionName: string, limits: ResourceLimits): Promise<void> {
    console.log(`Initializing resource pool for ${functionName}`);
    this.pools.set(functionName, {
      available: limits.poolSize || DEFAULT_LIMITS.poolSize!,
      total: limits.poolSize || DEFAULT_LIMITS.poolSize!,
      lastRefill: Date.now()
    });
  }

  getPool(functionName: string): ResourcePool | undefined {
    return this.pools.get(functionName);
  }

  async decrementPool(functionName: string): Promise<void> {
    const pool = this.pools.get(functionName);
    if (pool) {
      pool.available = Math.max(0, pool.available - 1);
      console.log(`${functionName} pool resources remaining: ${pool.available}/${pool.total}`);
    }
  }

  async refillPool(functionName: string): Promise<void> {
    const pool = this.pools.get(functionName);
    if (pool) {
      const now = Date.now();
      const timeSinceRefill = now - pool.lastRefill;
      if (timeSinceRefill >= 60000) {
        const refillAmount = Math.floor(timeSinceRefill / 60000);
        pool.available = Math.min(pool.total, pool.available + refillAmount);
        pool.lastRefill = now;
        console.log(`Refilled ${functionName} pool. Now at ${pool.available}/${pool.total}`);
      }
    }
  }

  async resizePool(functionName: string, newSize: number): Promise<void> {
    const pool = this.pools.get(functionName);
    if (pool) {
      const sizeDiff = newSize - pool.total;
      pool.total = newSize;
      pool.available = Math.min(newSize, pool.available + Math.max(0, sizeDiff));
      console.log(`Resized ${functionName} pool to ${newSize}. Available: ${pool.available}`);
    }
  }
}