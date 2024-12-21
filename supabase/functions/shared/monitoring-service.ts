import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug } from './logging-service.ts';

export interface ExecutionMetrics {
  duration_ms: number;
  success: boolean;
  error?: string;
  collection_stats?: {
    records_processed: number;
    records_updated: number;
  };
}

export async function logExecution(
  supabaseClient: ReturnType<typeof createClient>,
  functionName: string,
  metrics: ExecutionMetrics
) {
  logDebug(functionName, `Logging execution metrics:`, metrics);
  
  try {
    const { error: metricsError } = await supabaseClient
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

    if (metricsError) {
      console.error(`[${functionName}] Error logging metrics:`, metricsError);
      throw metricsError;
    }

    // Log detailed execution information
    const { error: logError } = await supabaseClient
      .from('schedule_execution_logs')
      .insert({
        schedule_id: await getScheduleId(supabaseClient, functionName),
        status: metrics.success ? 'completed' : 'failed',
        error_details: metrics.error,
        execution_duration_ms: metrics.duration_ms,
        execution_context: {
          collection_stats: metrics.collection_stats,
          timestamp: new Date().toISOString()
        }
      });

    if (logError) {
      console.error(`[${functionName}] Error creating execution log:`, logError);
      throw logError;
    }
  } catch (error) {
    console.error(`[${functionName}] Failed to log execution metrics:`, error);
  }
}

async function getScheduleId(
  supabaseClient: ReturnType<typeof createClient>,
  functionName: string
): Promise<string> {
  const { data, error } = await supabaseClient
    .from('schedules')
    .select('id')
    .eq('function_name', functionName)
    .single();

  if (error) {
    console.error(`Error getting schedule ID for ${functionName}:`, error);
    throw error;
  }

  return data.id;
}