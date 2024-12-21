import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface ExecutionMetrics {
  duration_ms: number;
  success: boolean;
  error?: string;
}

export async function logExecution(
  supabaseClient: ReturnType<typeof createClient>,
  functionName: string,
  metrics: ExecutionMetrics
) {
  console.log(`[${functionName}] Logging execution metrics:`, metrics);
  
  try {
    const { error } = await supabaseClient
      .from('api_health_metrics')
      .upsert({
        endpoint: functionName,
        success_count: metrics.success ? 1 : 0,
        error_count: metrics.success ? 0 : 1,
        avg_response_time: metrics.duration_ms,
        last_success_time: metrics.success ? new Date().toISOString() : null,
        last_error_time: metrics.success ? null : new Date().toISOString(),
        error_pattern: metrics.error ? { last_error: metrics.error } : null
      }, {
        onConflict: 'endpoint'
      });

    if (error) {
      console.error(`[${functionName}] Error logging metrics:`, error);
      throw error;
    }
  } catch (error) {
    console.error(`[${functionName}] Failed to log execution metrics:`, error);
  }
}