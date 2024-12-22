import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Schedule, ProcessedSchedule } from './types.ts';
import { createExecutionLog, updateExecutionLog } from './execution-logger.ts';

export async function processSchedule(
  supabaseClient: ReturnType<typeof createClient>,
  schedule: Schedule
): Promise<ProcessedSchedule> {
  console.log(`Processing schedule ${schedule.id} for function ${schedule.function_name}`);
  
  try {
    // Create execution log
    const executionContext = {
      schedule_type: schedule.schedule_type,
      time_config: schedule.time_config,
      execution_config: schedule.execution_config
    };

    const log = await createExecutionLog(supabaseClient, schedule.id, executionContext);
    
    // Execute function with proper timeout and auth
    const startTime = Date.now();
    console.log(`Invoking function ${schedule.function_name}`);
    
    const timeoutMs = (schedule.execution_config?.timeout_seconds || 30) * 1000;
    
    const functionPromise = supabaseClient.functions.invoke(
      schedule.function_name,
      {
        body: { 
          scheduled: true,
          context: executionContext
        }
      }
    );

    // Add timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Function execution timed out')), timeoutMs);
    });

    const { error: invokeError } = await Promise.race([functionPromise, timeoutPromise]);

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

    // Calculate next execution time based on schedule type
    let nextExecutionTime: Date | null = null;

    if (schedule.schedule_type === 'time_based' && schedule.time_config?.type === 'daily') {
      const hour = schedule.time_config.hour || 0;
      const now = new Date();
      nextExecutionTime = new Date();
      nextExecutionTime.setHours(hour, 0, 0, 0);
      
      if (nextExecutionTime <= now) {
        nextExecutionTime.setDate(nextExecutionTime.getDate() + 1);
      }
    }

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
      context: executionContext
    };

  } catch (error) {
    console.error(`Error processing schedule ${schedule.id}:`, error);
    
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
    .from('schedules')
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