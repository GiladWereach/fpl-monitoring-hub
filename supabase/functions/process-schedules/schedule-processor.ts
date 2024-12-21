import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Schedule, ProcessedSchedule } from './types.ts';
import { checkActiveMatches } from './match-service.ts';
import { createExecutionLog, updateExecutionLog } from './execution-logger.ts';

export async function processSchedule(
  supabaseClient: ReturnType<typeof createClient>,
  schedule: Schedule
): Promise<ProcessedSchedule> {
  console.log(`Processing schedule ${schedule.id} for function ${schedule.function_name}`);
  
  try {
    // Determine interval based on match status
    let intervalMinutes = schedule.base_interval_minutes;
    const hasActiveMatches = schedule.frequency_type === 'match_dependent' 
      ? await checkActiveMatches(supabaseClient)
      : false;

    if (schedule.frequency_type === 'match_dependent') {
      intervalMinutes = hasActiveMatches 
        ? schedule.match_day_interval_minutes 
        : schedule.non_match_interval_minutes;
    }

    // Create execution log
    const executionContext = {
      frequency_type: schedule.frequency_type,
      interval_minutes: intervalMinutes,
      has_active_matches: hasActiveMatches,
      consecutive_failures: schedule.consecutive_failures
    };

    const log = await createExecutionLog(supabaseClient, schedule.id, executionContext);
    
    // Execute function
    const startTime = Date.now();
    console.log(`Invoking function ${schedule.function_name}`);
    
    const { error: invokeError } = await supabaseClient.functions.invoke(
      schedule.function_name,
      {
        body: { 
          scheduled: true,
          context: {
            has_active_matches: hasActiveMatches,
            interval_minutes: intervalMinutes
          }
        }
      }
    );

    const executionDuration = Date.now() - startTime;
    const success = !invokeError;

    // Update execution log
    if (log) {
      await updateExecutionLog(
        supabaseClient,
        log.id,
        success,
        executionDuration,
        invokeError?.message
      );
    }

    // Calculate next execution time
    const nextExecutionTime = new Date();
    nextExecutionTime.setMinutes(nextExecutionTime.getMinutes() + intervalMinutes);

    // Update schedule status
    await updateScheduleStatus(
      supabaseClient,
      schedule.id,
      success,
      nextExecutionTime,
      schedule.consecutive_failures,
      invokeError?.message,
      executionDuration
    );

    return {
      id: schedule.id,
      function: schedule.function_name,
      success,
      duration: executionDuration,
      nextExecution: nextExecutionTime,
      context: {
        frequency_type: schedule.frequency_type,
        interval_minutes: intervalMinutes,
        has_active_matches: hasActiveMatches
      }
    };

  } catch (error) {
    console.error(`Error processing schedule ${schedule.id}:`, error);
    
    // Update schedule with error information
    await updateScheduleStatus(
      supabaseClient,
      schedule.id,
      false,
      null,
      schedule.consecutive_failures + 1,
      error.message
    );

    throw error;
  }
}

async function updateScheduleStatus(
  supabaseClient: ReturnType<typeof createClient>,
  scheduleId: string,
  success: boolean,
  nextExecutionTime: Date | null,
  currentFailures: number,
  errorMessage?: string,
  duration?: number
) {
  const { error: updateError } = await supabaseClient
    .from('function_schedules')
    .update({
      last_execution_at: new Date().toISOString(),
      next_execution_at: nextExecutionTime?.toISOString(),
      consecutive_failures: success ? 0 : currentFailures + 1,
      last_error: success ? null : errorMessage,
      execution_metrics: JSON.stringify({
        last_duration_ms: duration,
        last_success: success,
        last_error: errorMessage,
        last_execution: new Date().toISOString(),
        consecutive_failures: success ? 0 : currentFailures + 1
      })
    })
    .eq('id', scheduleId);

  if (updateError) {
    console.error('Error updating schedule status:', updateError);
    throw updateError;
  }
}