interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

class RateLimiterService {
  private static instance: RateLimiterService;
  private buckets: Map<string, TokenBucket>;
  private readonly REFILL_RATE = 60; // tokens per minute
  private readonly BUCKET_CAPACITY = 60;
  private readonly REFILL_INTERVAL = 60 * 1000; // 1 minute in ms

  private constructor() {
    this.buckets = new Map();
    console.log('Rate limiter service initialized');
  }

  public static getInstance(): RateLimiterService {
    if (!RateLimiterService.instance) {
      RateLimiterService.instance = new RateLimiterService();
    }
    return RateLimiterService.instance;
  }

  private refillBucket(bucket: TokenBucket): void {
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.REFILL_INTERVAL) * this.REFILL_RATE;

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(bucket.tokens + tokensToAdd, this.BUCKET_CAPACITY);
      bucket.lastRefill = now;
    }
  }

  public tryAcquire(key: string, tokens: number = 1): boolean {
    let bucket = this.buckets.get(key);
    
    if (!bucket) {
      bucket = {
        tokens: this.BUCKET_CAPACITY,
        lastRefill: Date.now()
      };
      this.buckets.set(key, bucket);
    }

    this.refillBucket(bucket);

    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      console.log(`Rate limit: Acquired ${tokens} tokens for ${key}. Remaining: ${bucket.tokens}`);
      return true;
    }

    console.log(`Rate limit exceeded for ${key}`);
    return false;
  }

  public getRemainingTokens(key: string): number {
    const bucket = this.buckets.get(key);
    if (!bucket) return this.BUCKET_CAPACITY;

    this.refillBucket(bucket);
    return bucket.tokens;
  }
}

export const rateLimiterService = RateLimiterService.getInstance();