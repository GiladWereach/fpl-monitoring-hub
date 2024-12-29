import { supabase } from "@/integrations/supabase/client";

interface ResourceLimits {
  maxConcurrent: number;
  rateLimit: number; // requests per minute
}

const DEFAULT_LIMITS: ResourceLimits = {
  maxConcurrent: 3,
  rateLimit: 30
};

export class ResourceManager {
  private static instance: ResourceManager;
  private activeTasks: Map<string, number> = new Map();
  private requestCounts: Map<string, number[]> = new Map();
  
  private constructor() {}

  static getInstance(): ResourceManager {
    if (!this.instance) {
      this.instance = new ResourceManager();
    }
    return this.instance;
  }

  async canExecute(functionName: string, limits: ResourceLimits = DEFAULT_LIMITS): Promise<boolean> {
    console.log(`Checking if ${functionName} can execute with limits:`, limits);
    
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

    // Log to database for monitoring
    try {
      await supabase.from('api_health_metrics').insert({
        endpoint: functionName,
        success_count: 1,
        error_count: 0,
        avg_response_time: 0,
        error_pattern: {
          concurrent_tasks: currentTasks + 1,
          rate_limit_status: requests.length
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
  }
}