import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../../shared/logging-service.ts';
import { executeInTransaction } from './transaction-service.ts';

export async function processSchedule(
  supabaseClient: ReturnType<typeof createClient>,
  schedule: any,
  instanceId: string
): Promise<boolean> {
  const startTime = Date.now();
  logDebug('schedule-processor', `Processing schedule: ${schedule.function_name}`);

  try {
    return await executeInTransaction(supabaseClient, async () => {
      // Try to acquire lock
      const { data: lockAcquired } = await supabaseClient
        .rpc('acquire_schedule_lock', {
          p_schedule_id: schedule.id,
          p_locked_by: instanceId,
          p_lock_duration_seconds: schedule.execution_config?.timeout_seconds || 300
        });

      if (!lockAcquired) {
        logDebug('schedule-processor', `Lock not acquired for ${schedule.function_name}`);
        return false;
      }

      try {
        // Create execution log
        const { data: log, error: logError } = await supabaseClient
          .from('schedule_execution_logs')
          .insert({
            schedule_id: schedule.id,
            status: 'running',
            execution_context: {
              instance_id: instanceId,
              schedule_type: schedule.schedule_type,
              interval: schedule.base_interval_minutes
            }
          })
          .select()
          .single();

        if (logError) throw logError;

        // Execute the function
        const { error: invokeError } = await supabaseClient.functions.invoke(
          schedule.function_name,
          {
            body: { scheduled: true, context: log.execution_context }
          }
        );

        if (invokeError) throw invokeError;

        const executionTime = Date.now() - startTime;

        // Update execution log
        await supabaseClient
          .from('schedule_execution_logs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            execution_duration_ms: executionTime
          })
          .eq('id', log.id);

        // Calculate and update next execution time
        await supabaseClient
          .rpc('update_next_execution_time', {
            schedule_id: schedule.id,
            execution_time: new Date().toISOString()
          });

        logDebug('schedule-processor', `Successfully processed ${schedule.function_name}`);
        return true;
      } finally {
        // Release lock
        await supabaseClient
          .rpc('release_schedule_lock', {
            p_schedule_id: schedule.id,
            p_locked_by: instanceId
          });
      }
    }, `process-schedule-${schedule.function_name}`);
  } catch (error) {
    logError('schedule-processor', `Error processing schedule ${schedule.function_name}:`, error);
    throw error;
  }
}