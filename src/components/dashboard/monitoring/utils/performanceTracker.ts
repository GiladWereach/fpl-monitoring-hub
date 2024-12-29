export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  timestamp: number;
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
    return performance.now();
  }

  endTracking(startTime: number): PerformanceMetrics {
    const endTime = performance.now();
    const metrics = {
      renderTime: endTime - startTime,
      memoryUsage: performance.memory?.usedJSHeapSize || 0,
      timestamp: Date.now()
    };
    
    this.metrics.push(metrics);
    console.log('Performance metrics recorded:', metrics);
    
    return metrics;
  }

  getMetrics(): PerformanceMetrics[] {
    return this.metrics;
  }
}

export const performanceTracker = PerformanceTracker.getInstance();