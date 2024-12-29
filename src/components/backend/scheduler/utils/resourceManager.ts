import { ResourcePoolManager, ResourceLimits, DEFAULT_LIMITS } from './resourcePool';
import { MetricsCollector } from './metricsCollector';
import { ResourcePredictor } from './resourcePredictor';
import { toast } from "@/hooks/use-toast";

export class ResourceManager {
  private static instance: ResourceManager;
  private activeTasks: Map<string, number> = new Map();
  private requestCounts: Map<string, number[]> = new Map();
  private poolManager: ResourcePoolManager;
  private metricsCollector: MetricsCollector;
  private predictor: ResourcePredictor;
  
  private constructor() {
    console.log('Initializing ResourceManager');
    this.poolManager = new ResourcePoolManager();
    this.metricsCollector = new MetricsCollector();
    this.predictor = new ResourcePredictor();
  }

  static getInstance(): ResourceManager {
    if (!this.instance) {
      this.instance = new ResourceManager();
    }
    return this.instance;
  }

  async canExecute(functionName: string, limits: ResourceLimits = DEFAULT_LIMITS): Promise<boolean> {
    console.log(`Checking if ${functionName} can execute with limits:`, limits);
    
    this.poolManager.initializePool(functionName, limits);
    
    // Check resource pool
    const pool = this.poolManager.getPool(functionName);
    if (pool?.available <= 0) {
      console.log(`${functionName} has no available resources in pool`);
      this.metricsCollector.recordMetric('error', 0);
      
      // Alert on resource exhaustion
      toast({
        title: "Resource Pool Exhausted",
        description: `${functionName} has depleted its resource pool`,
        variant: "destructive",
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
    this.poolManager.decrementPool(functionName);

    // Record metrics and predict usage
    this.metricsCollector.recordMetric('success', currentTasks + 1);
    this.predictor.recordUsage(functionName, currentTasks + 1);
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
    this.poolManager.refillPool(functionName);
  }

  getResourceMetrics(functionName: string): {
    activeTasks: number;
    requestRate: number;
    poolStatus?: { available: number; total: number };
    predictedUsage: number;
  } {
    const currentTasks = this.activeTasks.get(functionName) || 0;
    const requests = this.requestCounts.get(functionName) || [];
    const now = Date.now();
    const recentRequests = requests.filter(time => now - time < 60000).length;
    const pool = this.poolManager.getPool(functionName);
    const predictedUsage = this.predictor.predictNextUsage(functionName);

    return {
      activeTasks: currentTasks,
      requestRate: recentRequests,
      poolStatus: pool ? { available: pool.available, total: pool.total } : undefined,
      predictedUsage
    };
  }
}