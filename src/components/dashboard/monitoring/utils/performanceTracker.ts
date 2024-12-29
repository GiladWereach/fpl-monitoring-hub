import { supabase } from "@/integrations/supabase/client";

export interface PerformanceMetrics {
  responseTime: number;
  dataFreshness: number;
  errorRate: number;
}

export async function trackWindowPerformance(metrics: PerformanceMetrics) {
  console.log('Tracking window performance:', metrics);
  
  try {
    await supabase
      .from('api_health_metrics')
      .insert({
        endpoint: 'match_window_performance',
        avg_response_time: metrics.responseTime,
        error_pattern: {
          data_freshness: metrics.dataFreshness,
          error_rate: metrics.errorRate
        }
      });
  } catch (error) {
    console.error('Error tracking performance:', error);
  }
}

export function calculateDataFreshness(lastUpdate: Date): number {
  return Date.now() - lastUpdate.getTime();
}