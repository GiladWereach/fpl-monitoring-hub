interface MetricEntry {
  timestamp: number;
  type: string;
  value: number;
}

interface AggregatedMetrics {
  hourly: { timestamp: number; avg: number; count: number }[];
  daily: { timestamp: number; avg: number; count: number }[];
}

export class MetricsCollector {
  private metricsBuffer: MetricEntry[] = [];
  private readonly METRICS_FLUSH_INTERVAL = 60000; // 1 minute
  private aggregatedMetrics: AggregatedMetrics = {
    hourly: [],
    daily: []
  };
  
  constructor() {
    this.startMetricsFlush();
    this.setupRealtimeSubscription();
    console.log('MetricsCollector initialized with realtime updates');
  }

  private startMetricsFlush(): void {
    setInterval(() => this.flushMetrics(), this.METRICS_FLUSH_INTERVAL);
    console.log('Started metrics flush interval');
  }

  private setupRealtimeSubscription(): void {
    const { supabase } = await import("@/integrations/supabase/client");
    
    const channel = supabase
      .channel('metrics-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'api_health_metrics'
        },
        (payload) => {
          console.log('Received realtime metric update:', payload);
          this.processRealtimeUpdate(payload.new);
        }
      )
      .subscribe();

    console.log('Realtime subscription setup complete');
  }

  private processRealtimeUpdate(metric: any): void {
    const entry: MetricEntry = {
      timestamp: Date.now(),
      type: metric.endpoint,
      value: metric.avg_response_time
    };
    this.metricsBuffer.push(entry);
    this.updateAggregations(entry);
    console.log('Processed realtime update:', entry);
  }

  private updateAggregations(entry: MetricEntry): void {
    const hourTimestamp = Math.floor(entry.timestamp / 3600000) * 3600000;
    const dayTimestamp = Math.floor(entry.timestamp / 86400000) * 86400000;

    // Update hourly aggregation
    this.updateAggregation('hourly', hourTimestamp, entry.value);
    // Update daily aggregation
    this.updateAggregation('daily', dayTimestamp, entry.value);

    console.log('Updated metric aggregations');
  }

  private updateAggregation(period: 'hourly' | 'daily', timestamp: number, value: number): void {
    const metrics = this.aggregatedMetrics[period];
    const existing = metrics.find(m => m.timestamp === timestamp);

    if (existing) {
      existing.avg = (existing.avg * existing.count + value) / (existing.count + 1);
      existing.count++;
    } else {
      metrics.push({ timestamp, avg: value, count: 1 });
    }
  }

  async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    console.log(`Flushing ${this.metricsBuffer.length} metrics`);
    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      const formattedMetrics = {
        metrics_data: metrics.map(m => ({
          timestamp: m.timestamp,
          type: m.type,
          value: m.value
        })),
        summary: {
          total_entries: metrics.length,
          timestamp: new Date().toISOString(),
          aggregations: this.aggregatedMetrics
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
    const entry = {
      timestamp: Date.now(),
      type,
      value
    };
    
    this.metricsBuffer.push(entry);
    this.updateAggregations(entry);
    console.log(`Recorded metric - Type: ${type}, Value: ${value}`);
  }

  getAggregatedMetrics(): AggregatedMetrics {
    return this.aggregatedMetrics;
  }
}