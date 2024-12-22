import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Schedule, ProcessedSchedule } from './types.ts';
import { logDebug, logError } from '../shared/logging-service.ts';

export async function processSchedule(
  supabaseClient: ReturnType<typeof createClient>,
  schedule: Schedule & { current_interval: number }
): Promise<ProcessedSchedule> {
  logDebug('process-schedules', `Processing schedule ${schedule.id} for function ${schedule.function_name}`);
  
  try {
    const startTime = Date.now();
    logDebug('process-schedules', `Invoking function ${schedule.function_name}`);
    
    const timeoutMs = (schedule.execution_config?.timeout_seconds || 30) * 1000;
    
    const functionPromise = supabaseClient.functions.invoke(
      schedule.function_name,
      {
        body: { 
          scheduled: true,
          interval: schedule.current_interval,
          context: {
            schedule_type: schedule.schedule_type,
            execution_config: schedule.execution_config
          }
        }
      }
    );

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Function execution timed out')), timeoutMs);
    });

    const { error: invokeError } = await Promise.race([functionPromise, timeoutPromise]);
    const executionDuration = Date.now() - startTime;
    const success = !invokeError;

    // Log execution details
    await supabaseClient
      .from('schedule_execution_logs')
      .insert({
        schedule_id: schedule.id,
        status: success ? 'completed' : 'failed',
        error_details: invokeError?.message,
        execution_duration_ms: executionDuration,
        execution_context: {
          interval: schedule.current_interval,
          schedule_type: schedule.schedule_type
        }
      });

    if (!success) {
      logError('process-schedules', `Error executing ${schedule.function_name}:`, invokeError);
    }

    return {
      id: schedule.id,
      function: schedule.function_name,
      success,
      duration: executionDuration,
      nextExecution: null, // Will be set by the scheduler
      context: {
        schedule_type: schedule.schedule_type,
        interval: schedule.current_interval
      }
    };

  } catch (error) {
    logError('process-schedules', `Error processing schedule ${schedule.id}:`, error);
    throw error;
  }
}