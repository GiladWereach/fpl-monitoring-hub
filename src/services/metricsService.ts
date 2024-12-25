import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface PerformanceMetrics {
  executionTimeMs: number;
  memoryUsageMb: number;
  cacheHitRate: number;
  successRate: number;
  errorRate: number;
  throughput: number;
  requestCount: number;
}

export interface SystemMetrics {
  activeConnections: number;
  queueSize: number;
  avgResponseTime: number;
  errorCount: number;
  requestCount: number;
}

class MetricsService {
  private static instance: MetricsService;
  private metricsBuffer: Map<string, PerformanceMetrics>;
  private flushInterval: number = 30000; // Reduced to 30 seconds for more frequent updates
  private readonly MAX_BUFFER_SIZE = 1000;

  private constructor() {
    this.metricsBuffer = new Map();
    this.startPeriodicFlush();
    console.log('Metrics service initialized with 30s flush interval');
  }

  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  private startPeriodicFlush(): void {
    setInterval(() => this.flushMetrics(), this.flushInterval);
    console.log('Started periodic metrics flush');
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.size === 0) return;

    console.log(`Flushing ${this.metricsBuffer.size} metrics entries`);
    const metrics = Array.from(this.metricsBuffer.entries());
    this.metricsBuffer.clear();

    try {
      const { error } = await supabase
        .from('api_health_metrics')
        .upsert(
          metrics.map(([endpoint, data]) => ({
            endpoint: endpoint.replace(/-/g, '_'), // Standardize endpoint naming
            success_count: Math.round(data.successRate * data.requestCount),
            error_count: Math.round(data.errorRate * data.requestCount),
            avg_response_time: data.executionTimeMs,
            last_success_time: new Date().toISOString(),
            error_pattern: data.errorRate > 0 ? {
              type: 'execution_error',
              count: Math.round(data.errorRate * data.requestCount),
              timestamp: new Date().toISOString()
            } : {},
            created_at: new Date().toISOString()
          }))
        );

      if (error) {
        console.error('Error flushing metrics:', error);
        throw error;
      }
      console.log('Successfully flushed metrics to database');
    } catch (error) {
      console.error('Error flushing metrics:', error);
      toast({
        title: "Metrics Error",
        description: "Failed to flush metrics to database",
        variant: "destructive",
      });
    }
  }

  public recordMetric(
    endpoint: string,
    metrics: Partial<PerformanceMetrics>
  ): void {
    console.log(`Recording metrics for ${endpoint}:`, metrics);
    
    const existing = this.metricsBuffer.get(endpoint) || {
      executionTimeMs: 0,
      memoryUsageMb: 0,
      cacheHitRate: 0,
      successRate: 0,
      errorRate: 0,
      throughput: 0,
      requestCount: 0
    };

    const updated = {
      ...existing,
      ...metrics,
      requestCount: (existing.requestCount || 0) + 1
    };

    this.metricsBuffer.set(endpoint, updated);
    console.log(`Updated metrics buffer for ${endpoint}:`, updated);

    if (this.metricsBuffer.size >= this.MAX_BUFFER_SIZE) {
      console.log('Buffer size limit reached, triggering immediate flush');
      this.flushMetrics();
    }
  }

  public async getSystemMetrics(): Promise<SystemMetrics> {
    console.log('Fetching system metrics');
    try {
      const { data: metrics, error } = await supabase
        .rpc('get_aggregated_metrics', { hours_lookback: 1 }); // Reduced to 1 hour for more recent data

      if (error) throw error;

      const systemMetrics: SystemMetrics = {
        activeConnections: 0,
        queueSize: 0,
        avgResponseTime: metrics.reduce((sum: number, m: any) => sum + m.avg_response_time, 0) / metrics.length,
        errorCount: metrics.reduce((sum: number, m: any) => sum + m.total_errors, 0),
        requestCount: metrics.reduce((sum: number, m: any) => sum + m.total_successes + m.total_errors, 0)
      };

      console.log('Retrieved system metrics:', systemMetrics);
      return systemMetrics;
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      throw error;
    }
  }

  // Method to manually trigger metrics recording for testing
  public async recordTestMetrics(): Promise<void> {
    const testEndpoints = ['fetch_schedule', 'fetch_fixtures', 'calculate_points'];
    
    for (const endpoint of testEndpoints) {
      this.recordMetric(endpoint, {
        executionTimeMs: Math.random() * 1000,
        successRate: Math.random() > 0.2 ? 1 : 0,
        errorRate: Math.random() > 0.8 ? 1 : 0,
        requestCount: 1
      });
    }
    
    await this.flushMetrics();
    console.log('Test metrics recorded and flushed');
  }
}

export const metricsService = MetricsService.getInstance();