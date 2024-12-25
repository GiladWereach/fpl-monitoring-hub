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
  private flushInterval: number = 60000; // Flush every minute
  private readonly MAX_BUFFER_SIZE = 1000;

  private constructor() {
    this.metricsBuffer = new Map();
    this.startPeriodicFlush();
    console.log('Metrics service initialized');
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
            endpoint,
            success_count: Math.round(data.successRate * data.requestCount),
            error_count: Math.round(data.errorRate * data.requestCount),
            avg_response_time: data.executionTimeMs,
            last_success_time: new Date().toISOString(),
            error_pattern: {},
            created_at: new Date().toISOString()
          }))
        );

      if (error) throw error;
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

    if (this.metricsBuffer.size >= this.MAX_BUFFER_SIZE) {
      console.log('Buffer size limit reached, triggering immediate flush');
      this.flushMetrics();
    }
  }

  public async getSystemMetrics(): Promise<SystemMetrics> {
    console.log('Fetching system metrics');
    try {
      const { data: metrics, error } = await supabase
        .rpc('get_aggregated_metrics', { hours_lookback: 24 });

      if (error) throw error;

      const systemMetrics: SystemMetrics = {
        activeConnections: 0,
        queueSize: 0,
        avgResponseTime: metrics.reduce((sum, m) => sum + m.avg_response_time, 0) / metrics.length,
        errorCount: metrics.reduce((sum, m) => sum + m.total_errors, 0),
        requestCount: metrics.reduce((sum, m) => sum + m.total_successes + m.total_errors, 0)
      };

      console.log('Retrieved system metrics:', systemMetrics);
      return systemMetrics;
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      throw error;
    }
  }
}

export const metricsService = MetricsService.getInstance();