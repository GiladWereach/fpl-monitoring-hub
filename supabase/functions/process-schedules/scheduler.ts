import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Schedule } from './types.ts';

export const processSchedules = async (supabaseClient: ReturnType<typeof createClient>) => {
  console.log('Starting schedule processing...');
  
  try {
    // 1. Fetch active schedules
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
      .lte('next_execution_at', new Date().toISOString());

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
      throw schedulesError;
    }

    console.log(`Found ${activeSchedules?.length || 0} active schedules to process`);
    const processedSchedules = [];

    // 2. Process each schedule
    for (const schedule of (activeSchedules || [])) {
      try {
        console.log(`Processing schedule ${schedule.id} for function ${schedule.function_name}`);
        
        // Check for match-dependent scheduling
        let intervalMinutes = schedule.base_interval_minutes;
        if (schedule.frequency_type === 'match_dependent') {
          // Check for active matches
          const { data: activeMatches, error: matchError } = await supabaseClient
            .from('fixtures')
            .select('*')
            .eq('started', true)
            .eq('finished', false);

          if (matchError) {
            console.error('Error checking active matches:', matchError);
            throw matchError;
          }

          const hasActiveMatches = activeMatches && activeMatches.length > 0;
          intervalMinutes = hasActiveMatches 
            ? schedule.match_day_interval_minutes 
            : schedule.non_match_interval_minutes;

          console.log(`Match-dependent schedule: ${hasActiveMatches ? 'Active matches found' : 'No active matches'}, using ${intervalMinutes}min interval`);
        }

        // 3. Create execution log
        const { data: log, error: logError } = await supabaseClient
          .from('schedule_execution_logs')
          .insert({
            schedule_id: schedule.id,
            started_at: new Date().toISOString(),
            status: 'running'
          })
          .select()
          .single();

        if (logError) {
          console.error('Error creating execution log:', logError);
          throw logError;
        }

        // 4. Execute the function
        const startTime = Date.now();
        console.log(`Invoking function ${schedule.function_name}`);
        
        const { error: invokeError } = await supabaseClient.functions.invoke(
          schedule.function_name,
          {
            body: { scheduled: true }
          }
        );

        // 5. Update execution log
        const executionDuration = Date.now() - startTime;
        const success = !invokeError;
        
        if (log) {
          const { error: logUpdateError } = await supabaseClient
            .from('schedule_execution_logs')
            .update({
              completed_at: new Date().toISOString(),
              status: success ? 'completed' : 'failed',
              error_details: invokeError?.message,
              execution_duration_ms: executionDuration
            })
            .eq('id', log.id);

          if (logUpdateError) {
            console.error('Error updating execution log:', logUpdateError);
          }
        }

        // 6. Update schedule status and next execution
        const nextExecutionTime = new Date();
        nextExecutionTime.setMinutes(nextExecutionTime.getMinutes() + intervalMinutes);

        const { error: scheduleUpdateError } = await supabaseClient
          .from('function_schedules')
          .update({
            last_execution_at: new Date().toISOString(),
            next_execution_at: nextExecutionTime.toISOString(),
            consecutive_failures: success ? 0 : (schedule.consecutive_failures || 0) + 1,
            last_error: success ? null : invokeError?.message
          })
          .eq('id', schedule.id);

        if (scheduleUpdateError) {
          console.error('Error updating schedule:', scheduleUpdateError);
        }

        processedSchedules.push({
          id: schedule.id,
          function: schedule.function_name,
          success,
          duration: executionDuration,
          nextExecution: nextExecutionTime
        });

        console.log(`Successfully processed schedule ${schedule.id}`, {
          function: schedule.function_name,
          success,
          duration: executionDuration,
          nextExecution: nextExecutionTime
        });

      } catch (error) {
        console.error(`Error processing schedule ${schedule.id}:`, error);
        
        // Update schedule with error information
        const { error: updateError } = await supabaseClient
          .from('function_schedules')
          .update({
            consecutive_failures: (schedule.consecutive_failures || 0) + 1,
            last_error: error.message
          })
          .eq('id', schedule.id);

        if (updateError) {
          console.error('Error updating schedule error status:', updateError);
        }
      }
    }

    return processedSchedules;
  } catch (error) {
    console.error('Fatal error in processSchedules:', error);
    throw error;
  }
};