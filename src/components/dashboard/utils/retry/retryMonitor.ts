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

export const getRetryStats = async (functionName: string): Promise<{
  avgAttempts: number;
  successRate: number;
  avgDuration: number;
}> => {
  console.log(`Fetching retry stats for ${functionName}`);
  
  try {
    const { data, error } = await supabase
      .from('api_health_metrics')
      .select('*')
      .eq('endpoint', functionName)
      .single();

    if (error) throw error;

    const errorPattern = data.error_pattern as { retry_count?: number } || {};
    
    return {
      avgAttempts: errorPattern.retry_count || 1,
      successRate: data.success_count / (data.success_count + data.error_count) * 100,
      avgDuration: data.avg_response_time
    };
  } catch (error) {
    console.error('Failed to fetch retry stats:', error);
    return {
      avgAttempts: 0,
      successRate: 0,
      avgDuration: 0
    };
  }
};