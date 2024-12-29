interface MetricEntry {
  timestamp: number;
  type: string;
  value: number;
}

export class MetricsCollector {
  private metricsBuffer: MetricEntry[] = [];
  private readonly METRICS_FLUSH_INTERVAL = 60000; // 1 minute
  
  constructor() {
    this.startMetricsFlush();
    console.log('MetricsCollector initialized');
  }

  private startMetricsFlush(): void {
    setInterval(() => this.flushMetrics(), this.METRICS_FLUSH_INTERVAL);
    console.log('Started metrics flush interval');
  }

  async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    console.log(`Flushing ${this.metricsBuffer.length} metrics`);
    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      const { supabase } = await import("@/integrations/supabase/client");
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

  recordMetric(type: string, value: number): void {
    this.metricsBuffer.push({
      timestamp: Date.now(),
      type,
      value
    });
  }
}