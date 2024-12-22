import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Schedule, ProcessedSchedule } from './types.ts';
import { createExecutionLog, updateExecutionLog } from './execution-logger.ts';
import { checkActiveMatches } from './match-service.ts';

export async function processSchedule(
  supabaseClient: ReturnType<typeof createClient>,
  schedule: Schedule
): Promise<ProcessedSchedule> {
  console.log(`Processing schedule ${schedule.id} for function ${schedule.function_name}`);
  
  try {
    const executionContext = {
      schedule_type: schedule.schedule_type,
      time_config: schedule.time_config,
      execution_config: schedule.execution_config
    };

    const log = await createExecutionLog(supabaseClient, schedule.id, executionContext);
    
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

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Function execution timed out')), timeoutMs);
    });

    const { error: invokeError } = await Promise.race([functionPromise, timeoutPromise]);

    const executionDuration = Date.now() - startTime;
    const success = !invokeError;

    if (log) {
      await updateExecutionLog(
        supabaseClient,
        log.id,
        success,
        executionDuration,
        invokeError?.message
      );
    }

    let nextExecutionTime: Date | null = null;
    const now = new Date();

    // Calculate next execution time based on schedule type
    if (schedule.frequency_type === 'match_dependent') {
      const hasActiveMatches = await checkActiveMatches(supabaseClient);
      const intervalMinutes = hasActiveMatches ? 
        schedule.match_day_interval_minutes || 2 : 
        schedule.non_match_interval_minutes || 30;
      
      nextExecutionTime = new Date(now.getTime() + intervalMinutes * 60 * 1000);
    } 
    else if (schedule.frequency_type === 'daily' && schedule.fixed_time) {
      nextExecutionTime = new Date();
      const [hours] = schedule.fixed_time.split(':').map(Number);
      nextExecutionTime.setUTCHours(hours, 0, 0, 0);
      
      if (nextExecutionTime <= now) {
        nextExecutionTime.setDate(nextExecutionTime.getDate() + 1);
      }
    }

    // Update schedule status
    await supabaseClient
      .from('function_schedules')
      .update({
        last_execution_at: now.toISOString(),
        next_execution_at: nextExecutionTime?.toISOString(),
        consecutive_failures: success ? 0 : (schedule.consecutive_failures + 1),
        last_error: success ? null : invokeError?.message
      })
      .eq('id', schedule.id);

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
    
    await supabaseClient
      .from('function_schedules')
      .update({
        consecutive_failures: schedule.consecutive_failures + 1,
        last_error: error.message
      })
      .eq('id', schedule.id);

    throw error;
  }
}