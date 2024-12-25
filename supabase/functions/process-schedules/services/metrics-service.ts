import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../../shared/logging-service.ts';

export interface ExecutionMetrics {
  functionName: string;
  duration: number;
  status: 'completed' | 'failed';
  error?: {
    type: string;
    message: string;
    code?: string;
  };
  context?: Record<string, unknown>;
  performance?: {
    cpuTime?: number;
    memoryUsage?: number;
    networkLatency?: number;
  };
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
        error_pattern: metrics.error ? {
          type: metrics.error.type,
          message: metrics.error.message,
          code: metrics.error.code,
          context: metrics.context,
          performance: metrics.performance,
          timestamp: new Date().toISOString()
        } : null,
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

export async function getAggregatedMetrics(
  supabaseClient: ReturnType<typeof createClient>,
  endpoint: string,
  hours: number = 24
) {
  logDebug('metrics-service', `Getting aggregated metrics for ${endpoint} over ${hours}h`);

  try {
    const { data: metrics, error } = await supabaseClient
      .from('api_health_metrics')
      .select('*')
      .eq('endpoint', endpoint)
      .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const totalRequests = metrics.reduce((sum, m) => sum + m.success_count + m.error_count, 0);
    const successCount = metrics.reduce((sum, m) => sum + m.success_count, 0);
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.avg_response_time, 0) / metrics.length;

    return {
      totalRequests,
      successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
      avgResponseTime: isNaN(avgResponseTime) ? 0 : avgResponseTime,
      errorPatterns: metrics
        .filter(m => m.error_pattern)
        .map(m => m.error_pattern)
        .reduce((acc: any[], pattern) => {
          const existing = acc.find(p => p.type === pattern.type);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ ...pattern, count: 1 });
          }
          return acc;
        }, [])
    };
  } catch (error) {
    logError('metrics-service', `Error getting aggregated metrics for ${endpoint}:`, error);
    throw error;
  }
}