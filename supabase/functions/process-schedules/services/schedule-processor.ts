import { SupabaseClient } from '@supabase/supabase-js';
import { logDebug, logError, logInfo } from '../../../shared/logging-service';
import { ProcessingContext, ExecutionResult } from './types/processor-types';
import { detectMatchWindow } from './match-window-service';
import { executeFunction } from './execution-service';
import { acquireLock, releaseLock } from './lock-service';

export async function processSchedule(
  client: SupabaseClient,
  schedule: any,
  instanceId: string
): Promise<boolean> {
  const startTime = Date.now();
  logInfo('schedule-processor', `Processing schedule: ${schedule.function_name}`, {
    scheduleId: schedule.id,
    instanceId
  });

  try {
    // Try to acquire lock first
    const lockAcquired = await acquireLock(
      client,
      schedule.id,
      instanceId,
      schedule.execution_config?.timeout_seconds || 300
    );

    if (!lockAcquired) {
      logDebug('schedule-processor', `Lock not acquired for ${schedule.function_name}`);
      return false;
    }

    // Check match window for match-dependent schedules
    if (schedule.schedule_type === 'time_based' && schedule.time_config?.type === 'match_dependent') {
      const matchWindow = await detectMatchWindow(client);
      const intervalMinutes = matchWindow.hasActiveMatches 
        ? schedule.time_config.matchDayIntervalMinutes || 2
        : schedule.time_config.nonMatchIntervalMinutes || 30;
      
      logInfo('schedule-processor', `Using ${intervalMinutes} minute interval for ${schedule.function_name}`);
    }

    // Create execution log
    const { data: log, error: logError } = await client
      .from('schedule_execution_logs')
      .insert({
        schedule_id: schedule.id,
        status: 'running',
        execution_context: {
          instance_id: instanceId,
          schedule_type: schedule.schedule_type,
          started_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (logError) throw logError;

    // Execute with retry logic
    let success = false;
    let lastError = null;
    const maxRetries = schedule.execution_config?.retry_count || 3;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      const result = await executeFunction(client, schedule, instanceId, attempt);
      
      if (result.success) {
        success = true;
        break;
      }
      
      lastError = result.error;
      
      if (attempt <= maxRetries) {
        const delayMs = calculateBackoff(
          attempt,
          schedule.execution_config?.retry_backoff || 'linear',
          schedule.execution_config?.retry_delay_seconds * 1000
        );
        logInfo('schedule-processor', `Retrying ${schedule.function_name} in ${delayMs}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    const executionTime = Date.now() - startTime;

    // Update execution log
    await client
      .from('schedule_execution_logs')
      .update({
        status: success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        execution_duration_ms: executionTime,
        error_details: lastError ? JSON.stringify(lastError) : null
      })
      .eq('id', log.id);

    // Update schedule metrics
    await client
      .from('api_health_metrics')
      .insert({
        endpoint: schedule.function_name,
        success_count: success ? 1 : 0,
        error_count: success ? 0 : 1,
        avg_response_time: executionTime,
        last_success_time: success ? new Date().toISOString() : null,
        last_error_time: success ? null : new Date().toISOString()
      });

    // Release lock
    await releaseLock(client, schedule.id, instanceId);

    return success;
  } catch (error) {
    logError('schedule-processor', `Fatal error processing schedule ${schedule.function_name}:`, error);
    throw error;
  }
}