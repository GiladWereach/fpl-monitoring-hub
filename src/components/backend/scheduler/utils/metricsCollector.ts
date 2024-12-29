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
      
      // Format metrics data to match expected JSON structure
      const formattedMetrics = {
        metrics_data: metrics.map(m => ({
          timestamp: m.timestamp,
          type: m.type,
          value: m.value
        })),
        summary: {
          total_entries: metrics.length,
          timestamp: new Date().toISOString()
        }
      };

      await supabase.from('api_health_metrics').insert({
        endpoint: 'resource_manager_metrics',
        success_count: metrics.filter(m => m.type === 'success').length,
        error_count: metrics.filter(m => m.type === 'error').length,
        avg_response_time: metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length,
        error_pattern: formattedMetrics,
        created_at: new Date().toISOString()
      });

      console.log('Successfully flushed metrics to database');
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
    console.log(`Recorded metric - Type: ${type}, Value: ${value}`);
  }
}