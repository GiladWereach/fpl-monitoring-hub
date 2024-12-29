import { supabase } from "@/integrations/supabase/client";

interface ResourceLimits {
  maxConcurrent: number;
  rateLimit: number; // requests per minute
  poolSize?: number;
}

interface ResourcePool {
  available: number;
  total: number;
  lastRefill: number;
}

const DEFAULT_LIMITS: ResourceLimits = {
  maxConcurrent: 3,
  rateLimit: 30,
  poolSize: 10
};

export class ResourceManager {
  private static instance: ResourceManager;
  private activeTasks: Map<string, number> = new Map();
  private requestCounts: Map<string, number[]> = new Map();
  private resourcePools: Map<string, ResourcePool> = new Map();
  private metricsBuffer: { timestamp: number, type: string, value: number }[] = [];
  private readonly METRICS_FLUSH_INTERVAL = 60000; // 1 minute
  
  private constructor() {
    console.log('Initializing ResourceManager');
    this.startMetricsFlush();
  }

  static getInstance(): ResourceManager {
    if (!this.instance) {
      this.instance = new ResourceManager();
    }
    return this.instance;
  }

  private startMetricsFlush(): void {
    setInterval(() => this.flushMetrics(), this.METRICS_FLUSH_INTERVAL);
    console.log('Started metrics flush interval');
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    console.log(`Flushing ${this.metricsBuffer.length} metrics`);
    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      await supabase.from('api_health_metrics').insert({
        endpoint: 'resource_manager_metrics',
        success_count: metrics.filter(m => m.type === 'success').length,
        error_count: metrics.filter(m => m.type === 'error').length,
        avg_response_time: 0,
        error_pattern: {
          metrics: metrics,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error flushing resource metrics:', error);
    }
  }

  private initializePool(functionName: string, limits: ResourceLimits): void {
    if (!this.resourcePools.has(functionName)) {
      console.log(`Initializing resource pool for ${functionName}`);
      this.resourcePools.set(functionName, {
        available: limits.poolSize || DEFAULT_LIMITS.poolSize!,
        total: limits.poolSize || DEFAULT_LIMITS.poolSize!,
        lastRefill: Date.now()
      });
    }
  }

  async canExecute(functionName: string, limits: ResourceLimits = DEFAULT_LIMITS): Promise<boolean> {
    console.log(`Checking if ${functionName} can execute with limits:`, limits);
    
    this.initializePool(functionName, limits);
    
    // Check resource pool
    const pool = this.resourcePools.get(functionName)!;
    if (pool.available <= 0) {
      console.log(`${functionName} has no available resources in pool`);
      this.metricsBuffer.push({
        timestamp: Date.now(),
        type: 'error',
        value: 0
      });
      return false;
    }

    // Check concurrent executions
    const currentTasks = this.activeTasks.get(functionName) || 0;
    if (currentTasks >= limits.maxConcurrent) {
      console.log(`${functionName} at concurrent execution limit: ${currentTasks}/${limits.maxConcurrent}`);
      return false;
    }

    // Check rate limits
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const requests = this.requestCounts.get(functionName) || [];
    const recentRequests = requests.filter(time => Math.floor(time / 60000) === minute).length;
    
    if (recentRequests >= limits.rateLimit) {
      console.log(`${functionName} at rate limit: ${recentRequests}/${limits.rateLimit} per minute`);
      return false;
    }

    return true;
  }

  async trackExecution(functionName: string): Promise<void> {
    console.log(`Tracking execution for ${functionName}`);
    
    // Update concurrent tasks
    const currentTasks = this.activeTasks.get(functionName) || 0;
    this.activeTasks.set(functionName, currentTasks + 1);
    
    // Update rate limiting
    const requests = this.requestCounts.get(functionName) || [];
    requests.push(Date.now());
    this.requestCounts.set(functionName, requests);

    // Update resource pool
    const pool = this.resourcePools.get(functionName);
    if (pool) {
      pool.available--;
      console.log(`${functionName} pool resources remaining: ${pool.available}/${pool.total}`);
    }

    this.metricsBuffer.push({
      timestamp: Date.now(),
      type: 'success',
      value: currentTasks + 1
    });

    // Log to database for monitoring
    try {
      await supabase.from('api_health_metrics').insert({
        endpoint: functionName,
        success_count: 1,
        error_count: 0,
        avg_response_time: 0,
        error_pattern: {
          concurrent_tasks: currentTasks + 1,
          rate_limit_status: requests.length,
          pool_status: pool ? `${pool.available}/${pool.total}` : 'N/A'
        }
      });
    } catch (error) {
      console.error('Error logging resource metrics:', error);
    }
  }

  async releaseExecution(functionName: string): Promise<void> {
    console.log(`Releasing execution for ${functionName}`);
    
    const currentTasks = this.activeTasks.get(functionName) || 1;
    this.activeTasks.set(functionName, Math.max(0, currentTasks - 1));
    
    // Clean up old rate limit entries
    const now = Date.now();
    const requests = this.requestCounts.get(functionName) || [];
    const recentRequests = requests.filter(time => now - time < 60000);
    this.requestCounts.set(functionName, recentRequests);

    // Refill pool if needed
    const pool = this.resourcePools.get(functionName);
    if (pool) {
      const timeSinceRefill = now - pool.lastRefill;
      if (timeSinceRefill >= 60000) { // Refill every minute
        const refillAmount = Math.floor(timeSinceRefill / 60000);
        pool.available = Math.min(pool.total, pool.available + refillAmount);
        pool.lastRefill = now;
        console.log(`Refilled ${functionName} pool. Now at ${pool.available}/${pool.total}`);
      }
    }
  }

  getResourceMetrics(functionName: string): {
    activeTasks: number;
    requestRate: number;
    poolStatus?: { available: number; total: number };
  } {
    const currentTasks = this.activeTasks.get(functionName) || 0;
    const requests = this.requestCounts.get(functionName) || [];
    const now = Date.now();
    const recentRequests = requests.filter(time => now - time < 60000).length;
    const pool = this.resourcePools.get(functionName);

    return {
      activeTasks: currentTasks,
      requestRate: recentRequests,
      poolStatus: pool ? { available: pool.available, total: pool.total } : undefined
    };
  }
}