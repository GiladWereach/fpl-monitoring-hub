interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  timestamp: number;
}

interface WindowPerformanceMetrics {
  responseTime: number;
  dataFreshness: number;
  errorRate: number;
}

// Add proper type checking for Performance.memory
interface ExtendedPerformance extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: PerformanceMetrics[] = [];

  private constructor() {}

  static getInstance(): PerformanceTracker {
    if (!this.instance) {
      this.instance = new PerformanceTracker();
    }
    return this.instance;
  }

  startTracking(): number {
    console.log('Starting performance tracking');
    return performance.now();
  }

  endTracking(startTime: number): PerformanceMetrics {
    const endTime = performance.now();
    const extendedPerf = performance as ExtendedPerformance;
    
    const metrics = {
      renderTime: endTime - startTime,
      memoryUsage: extendedPerf.memory?.usedJSHeapSize || 0,
      timestamp: Date.now()
    };
    
    console.log('Performance metrics recorded:', metrics);
    this.metrics.push(metrics);
    
    return metrics;
  }

  getMetrics(): PerformanceMetrics[] {
    return this.metrics;
  }
}

export const performanceTracker = PerformanceTracker.getInstance();

// Add the missing exports
export const calculateDataFreshness = (windowStart: Date): number => {
  console.log('Calculating data freshness for window:', windowStart);
  const now = Date.now();
  const windowTime = windowStart.getTime();
  const freshnessScore = Math.max(0, 100 - ((now - windowTime) / (60 * 1000))); // Decay per minute
  console.log('Calculated freshness score:', freshnessScore);
  return Number(freshnessScore.toFixed(2));
};

export const trackWindowPerformance = async (metrics: WindowPerformanceMetrics): Promise<void> => {
  console.log('Tracking window performance:', metrics);
  try {
    const { data, error } = await supabase
      .from('api_health_metrics')
      .insert({
        endpoint: 'match_window',
        success_count: metrics.errorRate === 0 ? 1 : 0,
        error_count: metrics.errorRate > 0 ? 1 : 0,
        avg_response_time: metrics.responseTime,
        error_pattern: {
          data_freshness: metrics.dataFreshness,
          error_rate: metrics.errorRate
        }
      });

    if (error) {
      console.error('Error tracking window performance:', error);
      throw error;
    }

    console.log('Successfully tracked window performance');
  } catch (error) {
    console.error('Failed to track window performance:', error);
    throw error;
  }
};