import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError, logInfo } from '../../shared/logging-service.ts';
import { executeInTransaction } from './transaction-service.ts';
import { calculateBackoff } from '../utils/retry.ts';

export async function processSchedule(
  supabaseClient: ReturnType<typeof createClient>,
  schedule: any,
  instanceId: string
): Promise<boolean> {
  const startTime = Date.now();
  logInfo('schedule-processor', `Starting to process schedule: ${schedule.function_name}`, {
    scheduleId: schedule.id,
    instanceId,
    functionName: schedule.function_name
  });

  try {
    return await executeInTransaction(supabaseClient, async (client) => {
      // Try to acquire lock with proper error handling
      const { data: lockAcquired, error: lockError } = await client
        .rpc('acquire_schedule_lock', {
          p_schedule_id: schedule.id,
          p_locked_by: instanceId,
          p_lock_duration_seconds: schedule.execution_config?.timeout_seconds || 300
        });

      if (lockError) {
        logError('schedule-processor', `Error acquiring lock for ${schedule.function_name}:`, lockError);
        throw lockError;
      }

      if (!lockAcquired) {
        logDebug('schedule-processor', `Lock not acquired for ${schedule.function_name} - another instance is processing`);
        return false;
      }

      try {
        // Create execution log with detailed context
        const { data: log, error: logError } = await client
          .from('schedule_execution_logs')
          .insert({
            schedule_id: schedule.id,
            status: 'running',
            execution_context: {
              instance_id: instanceId,
              schedule_type: schedule.schedule_type,
              interval: schedule.base_interval_minutes,
              execution_attempt: 1,
              started_at: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (logError) {
          logError('schedule-processor', `Error creating execution log for ${schedule.function_name}:`, logError);
          throw logError;
        }

        logInfo('schedule-processor', `Created execution log for ${schedule.function_name}`, {
          logId: log.id,
          scheduleId: schedule.id
        });

        // Execute the function with retry logic
        let success = false;
        let lastError = null;
        const maxRetries = schedule.execution_config?.retry_count || 3;
        const backoffStrategy = schedule.execution_config?.retry_backoff || 'linear';

        for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
          try {
            const { error: invokeError } = await client.functions.invoke(
              schedule.function_name,
              {
                body: { 
                  scheduled: true,
                  context: {
                    ...log.execution_context,
                    attempt
                  }
                }
              }
            );

            if (invokeError) throw invokeError;
            
            success = true;
            break;
          } catch (error) {
            lastError = error;
            logError('schedule-processor', `Attempt ${attempt} failed for ${schedule.function_name}:`, error);

            if (attempt <= maxRetries) {
              const delayMs = calculateBackoff(attempt, backoffStrategy, schedule.execution_config?.retry_delay_seconds * 1000);
              logInfo('schedule-processor', `Retrying ${schedule.function_name} in ${delayMs}ms (attempt ${attempt}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }
          }
        }

        const executionTime = Date.now() - startTime;

        // Update execution log with final status
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
          .upsert({
            endpoint: schedule.function_name,
            success_count: success ? 1 : 0,
            error_count: success ? 0 : 1,
            avg_response_time: executionTime,
            last_success_time: success ? new Date().toISOString() : null,
            last_error_time: success ? null : new Date().toISOString()
          });

        // Calculate and update next execution time
        if (success) {
          await client
            .rpc('update_next_execution_time', {
              schedule_id: schedule.id,
              execution_time: new Date().toISOString()
            });
          
          logInfo('schedule-processor', `Successfully processed ${schedule.function_name}`, {
            duration: executionTime,
            scheduleId: schedule.id
          });
        } else {
          // Update failure count and potentially disable schedule
          const { error: updateError } = await client
            .from('schedules')
            .update({
              consecutive_failures: schedule.consecutive_failures + 1,
              last_error: lastError?.message || 'Unknown error',
              status: schedule.consecutive_failures >= 4 ? 'error' : 'active'
            })
            .eq('id', schedule.id);

          if (updateError) {
            logError('schedule-processor', `Error updating schedule failure count:`, updateError);
          }
        }

        return success;
      } finally {
        // Always release lock
        await client
          .rpc('release_schedule_lock', {
            p_schedule_id: schedule.id,
            p_locked_by: instanceId
          });
      }
    }, `process-schedule-${schedule.function_name}`);
  } catch (error) {
    logError('schedule-processor', `Fatal error processing schedule ${schedule.function_name}:`, error);
    throw error;
  }
}