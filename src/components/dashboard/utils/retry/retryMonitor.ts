import { supabase } from "@/integrations/supabase/client";

export interface RetryMetrics {
  functionName: string;
  totalAttempts: number;
  successfulAttempt: number | null;
  totalDuration: number;
  error?: string;
}

export const logRetryMetrics = async (metrics: RetryMetrics): Promise<void> => {
  console.log('Logging retry metrics:', metrics);
  
  try {
    const { error } = await supabase
      .from('api_health_metrics')
      .upsert({
        endpoint: metrics.functionName,
        success_count: metrics.successfulAttempt ? 1 : 0,
        error_count: metrics.successfulAttempt ? 0 : 1,
        avg_response_time: metrics.totalDuration,
        last_success_time: metrics.successfulAttempt ? new Date().toISOString() : null,
        last_error_time: metrics.successfulAttempt ? null : new Date().toISOString(),
        error_pattern: metrics.error ? {
          last_error: metrics.error,
          retry_count: metrics.totalAttempts
        } : null
      });

    if (error) throw error;
    console.log('Successfully logged retry metrics');
  } catch (error) {
    console.error('Failed to log retry metrics:', error);
  }
};