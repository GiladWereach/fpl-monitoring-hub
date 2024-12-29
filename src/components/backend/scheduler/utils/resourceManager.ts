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
    
    // Initialize or adjust pool based on predictions
    await this.adjustPoolSize(functionName, limits);
    
    // Check resource pool
    const pool = this.poolManager.getPool(functionName);
    if (pool?.available <= 0) {
      console.log(`${functionName} has no available resources in pool`);
      this.metricsCollector.recordMetric('error', 0);
      
      // Alert on resource exhaustion with more context
      const prediction = this.predictor.predictNextUsage(functionName);
      toast({
        title: "Resource Pool Exhausted",
        description: `${functionName} has depleted its resource pool. Expected availability in ${this.estimateAvailabilityTime(prediction)} minutes`,
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

    // Check rate limits with prediction-based adjustment
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const requests = this.requestCounts.get(functionName) || [];
    const recentRequests = requests.filter(time => Math.floor(time / 60000) === minute).length;
    
    const prediction = this.predictor.predictNextUsage(functionName);
    const adjustedRateLimit = this.calculateAdjustedRateLimit(limits.rateLimit, prediction);
    
    if (recentRequests >= adjustedRateLimit) {
      console.log(`${functionName} at adjusted rate limit: ${recentRequests}/${adjustedRateLimit} per minute`);
      return false;
    }

    return true;
  }

  private async adjustPoolSize(functionName: string, limits: ResourceLimits): Promise<void> {
    const prediction = this.predictor.predictNextUsage(functionName);
    const currentPool = this.poolManager.getPool(functionName);
    
    if (!currentPool) {
      // Initialize pool with predicted size
      const initialSize = Math.max(
        limits.poolSize || DEFAULT_LIMITS.poolSize!,
        Math.ceil(prediction.predictedUsage * 1.2) // 20% buffer
      );
      this.poolManager.initializePool(functionName, { ...limits, poolSize: initialSize });
      return;
    }

    // Adjust pool size based on prediction and confidence
    const recommendedSize = Math.ceil(prediction.predictedUsage * (1 + (1 - prediction.confidence)));
    if (Math.abs(recommendedSize - currentPool.total) > currentPool.total * 0.2) { // 20% threshold
      const newSize = Math.max(limits.poolSize || DEFAULT_LIMITS.poolSize!, recommendedSize);
      await this.poolManager.resizePool(functionName, newSize);
      console.log(`Adjusted pool size for ${functionName} to ${newSize} based on predictions`);
    }
  }

  private calculateAdjustedRateLimit(baseLimit: number, prediction: PredictionResult): number {
    // Adjust rate limit based on prediction confidence and anomaly score
    const adjustmentFactor = Math.max(0.5, Math.min(1.5, 
      1 + (prediction.confidence - 0.5) - (prediction.anomalyScore * 0.1)
    ));
    return Math.round(baseLimit * adjustmentFactor);
  }

  private estimateAvailabilityTime(prediction: PredictionResult): number {
    // Estimate time until resources become available based on prediction
    const baseTime = 5; // Base waiting time in minutes
    return Math.round(baseTime * (1 + prediction.anomalyScore));
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
