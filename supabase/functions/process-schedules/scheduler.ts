import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { calculateNextExecutionTime } from './schedule-calculator.ts';
import { logDebug, logError } from '../shared/logging-service.ts';

export async function processSchedules(supabaseClient: ReturnType<typeof createClient>) {
  logDebug('scheduler', 'Starting schedule processing...');
  
  try {
    // Get all active schedules that are due for execution
    const { data: activeSchedules, error: schedulesError } = await supabaseClient
      .from('function_schedules')
      .select(`
        *,
        schedule_groups (
          name,
          description
        )
      `)
      .eq('status', 'active')
      .or('next_execution_at.is.null,next_execution_at.lte.now()');

    if (schedulesError) {
      logError('scheduler', 'Error fetching schedules:', schedulesError);
      throw schedulesError;
    }

    logDebug('scheduler', `Found ${activeSchedules?.length || 0} schedules to process`);
    const processedSchedules = [];

    for (const schedule of (activeSchedules || [])) {
      try {
        logDebug('scheduler', `Processing schedule for ${schedule.function_name}`);
        
        // Execute the function
        const startTime = Date.now();
        const { error: invokeError } = await supabaseClient.functions.invoke(schedule.function_name);
        
        if (invokeError) {
          logError('scheduler', `Error executing ${schedule.function_name}:`, invokeError);
          throw invokeError;
        }

        const executionTime = Date.now() - startTime;
        logDebug('scheduler', `Successfully executed ${schedule.function_name} in ${executionTime}ms`);

        // Calculate and set next execution time
        const nextExecutionTime = await calculateNextExecutionTime(supabaseClient, schedule);
        
        // Update schedule with execution results
        const { error: updateError } = await supabaseClient
          .from('function_schedules')
          .update({
            last_execution_at: new Date().toISOString(),
            next_execution_at: nextExecutionTime.toISOString(),
            consecutive_failures: 0,
            last_error: null
          })
          .eq('id', schedule.id);

        if (updateError) {
          logError('scheduler', `Error updating schedule ${schedule.id}:`, updateError);
          throw updateError;
        }

        processedSchedules.push({
          id: schedule.id,
          function: schedule.function_name,
          success: true,
          duration: executionTime,
          nextExecution: nextExecutionTime
        });

      } catch (error) {
        logError('scheduler', `Failed to process schedule ${schedule.id}:`, error);
        
        // Update failure count and error message
        await supabaseClient
          .from('function_schedules')
          .update({
            consecutive_failures: schedule.consecutive_failures + 1,
            last_error: error.message,
            status: schedule.consecutive_failures >= 5 ? 'error' : 'active'
          })
          .eq('id', schedule.id);
      }
    }

    return processedSchedules;
  } catch (error) {
    logError('scheduler', 'Fatal error in processSchedules:', error);
    throw error;
  }
}