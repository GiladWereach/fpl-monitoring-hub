interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheEntry<any>>;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;
  private cleanupInterval: number = 60000; // Cleanup every minute

  private constructor() {
    this.cache = new Map();
    this.startPeriodicCleanup();
    console.log('Cache service initialized');
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private startPeriodicCleanup(): void {
    setInterval(() => this.cleanup(), this.cleanupInterval);
    console.log('Started periodic cache cleanup');
  }

  private cleanup(): void {
    console.log('Running cache cleanup');
    const now = Date.now();
    let cleanupCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.DEFAULT_TTL) {
        this.cache.delete(key);
        cleanupCount++;
      }
    }

    console.log(`Cleaned up ${cleanupCount} expired cache entries`);
  }

  public set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): void {
    console.log(`Setting cache entry for key: ${key}`);
    
    // If cache is full, remove least recently used entries
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      console.log('Cache size limit reached, removing old entries');
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove 10% of oldest entries
      const removeCount = Math.ceil(this.MAX_CACHE_SIZE * 0.1);
      entries.slice(0, removeCount).forEach(([key]) => this.cache.delete(key));
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0
    });
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    console.log(`Cache ${entry ? 'hit' : 'miss'} for key: ${key}`);

    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.DEFAULT_TTL) {
      console.log(`Cache entry expired for key: ${key}`);
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.value as T;
  }

  public getStats() {
    const totalEntries = this.cache.size;
    const totalHits = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.hits, 0);

    return {
      size: totalEntries,
      hits: totalHits,
      maxSize: this.MAX_CACHE_SIZE,
      ttl: this.DEFAULT_TTL
    };
  }
}

export const cacheService = CacheService.getInstance();