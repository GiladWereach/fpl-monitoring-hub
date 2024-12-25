import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../../shared/logging-service.ts';

export interface ExecutionMetrics {
  functionName: string;
  duration: number;
  status: 'completed' | 'failed';
  error?: string;
  context?: Record<string, unknown>;
}

export async function logExecutionMetrics(
  supabaseClient: ReturnType<typeof createClient>,
  metrics: ExecutionMetrics
) {
  logDebug('metrics-service', `Logging execution metrics for ${metrics.functionName}:`, metrics);

  try {
    const { error: metricsError } = await supabaseClient
      .from('api_health_metrics')
      .insert({
        endpoint: metrics.functionName,
        success_count: metrics.status === 'completed' ? 1 : 0,
        error_count: metrics.status === 'completed' ? 0 : 1,
        avg_response_time: metrics.duration,
        last_success_time: metrics.status === 'completed' ? new Date().toISOString() : null,
        last_error_time: metrics.status === 'failed' ? new Date().toISOString() : null,
        error_pattern: metrics.error ? { last_error: metrics.error } : null,
        created_at: new Date().toISOString()
      });

    if (metricsError) {
      logError('metrics-service', `Error logging metrics for ${metrics.functionName}:`, metricsError);
      throw metricsError;
    }

    logDebug('metrics-service', `Successfully logged metrics for ${metrics.functionName}`);
  } catch (error) {
    logError('metrics-service', `Failed to log metrics for ${metrics.functionName}:`, error);
    // Don't throw - we don't want metrics logging to break the main flow
  }
}