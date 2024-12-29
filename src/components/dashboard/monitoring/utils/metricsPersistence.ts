import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface PersistedMetric {
  timestamp: string;
  metrics: any;
  performance_data?: {
    render_time: number;
    memory_usage: number;
  };
}

export async function persistMetrics(metrics: any, performanceData?: PersistedMetric['performance_data']) {
  console.log('Persisting metrics with performance data:', { metrics, performanceData });
  
  try {
    const { error } = await supabase
      .from('api_health_metrics')
      .insert({
        endpoint: 'resource_monitoring',
        success_count: metrics.filter((m: any) => !m.error).length,
        error_count: metrics.filter((m: any) => m.error).length,
        avg_response_time: performanceData?.render_time || 0,
        error_pattern: {
          metrics: metrics,
          performance: performanceData
        }
      });

    if (error) throw error;
    
    console.log('Successfully persisted metrics');
  } catch (err) {
    console.error('Error persisting metrics:', err);
    toast({
      title: "Error Saving Metrics",
      description: "Failed to persist resource metrics",
      variant: "destructive",
    });
  }
}