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
        let hasActiveMatches = false;

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

          hasActiveMatches = activeMatches && activeMatches.length > 0;
          intervalMinutes = hasActiveMatches 
            ? schedule.match_day_interval_minutes 
            : schedule.non_match_interval_minutes;

          console.log(`Match-dependent schedule: ${hasActiveMatches ? 'Active matches found' : 'No active matches'}, using ${intervalMinutes}min interval`);
        }

        // 3. Create execution log with enhanced context
        const { data: log, error: logError } = await supabaseClient
          .from('schedule_execution_logs')
          .insert({
            schedule_id: schedule.id,
            started_at: new Date().toISOString(),
            status: 'running',
            execution_context: JSON.stringify({
              frequency_type: schedule.frequency_type,
              interval_minutes: intervalMinutes,
              has_active_matches: hasActiveMatches,
              consecutive_failures: schedule.consecutive_failures
            })
          })
          .select()
          .single();

        if (logError) {
          console.error('Error creating execution log:', logError);
          throw logError;
        }

        // 4. Execute the function with enhanced error handling
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

        // 5. Update execution log with comprehensive metrics
        const executionDuration = Date.now() - startTime;
        const success = !invokeError;
        
        if (log) {
          const { error: logUpdateError } = await supabaseClient
            .from('schedule_execution_logs')
            .update({
              completed_at: new Date().toISOString(),
              status: success ? 'completed' : 'failed',
              error_details: invokeError?.message,
              execution_duration_ms: executionDuration,
              execution_metrics: JSON.stringify({
                duration_ms: executionDuration,
                success,
                error: invokeError?.message,
                timestamp: new Date().toISOString()
              })
            })
            .eq('id', log.id);

          if (logUpdateError) {
            console.error('Error updating execution log:', logUpdateError);
          }
        }

        // 6. Update schedule status with enhanced error tracking
        const nextExecutionTime = new Date();
        nextExecutionTime.setMinutes(nextExecutionTime.getMinutes() + intervalMinutes);

        const { error: scheduleUpdateError } = await supabaseClient
          .from('function_schedules')
          .update({
            last_execution_at: new Date().toISOString(),
            next_execution_at: nextExecutionTime.toISOString(),
            consecutive_failures: success ? 0 : (schedule.consecutive_failures || 0) + 1,
            last_error: success ? null : invokeError?.message,
            execution_metrics: JSON.stringify({
              last_duration_ms: executionDuration,
              last_success: success,
              last_error: invokeError?.message,
              last_execution: new Date().toISOString(),
              consecutive_failures: success ? 0 : (schedule.consecutive_failures || 0) + 1
            })
          })
          .eq('id', schedule.id);

        if (scheduleUpdateError) {
          console.error('Error updating schedule:', scheduleUpdateError);
        }

        // Track processed schedule
        processedSchedules.push({
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
        });

        console.log(`Successfully processed schedule ${schedule.id}`, {
          function: schedule.function_name,
          success,
          duration: executionDuration,
          nextExecution: nextExecutionTime,
          metrics: {
            consecutive_failures: success ? 0 : (schedule.consecutive_failures || 0) + 1,
            interval_minutes: intervalMinutes,
            has_active_matches: hasActiveMatches
          }
        });

      } catch (error) {
        console.error(`Error processing schedule ${schedule.id}:`, error);
        
        // Update schedule with comprehensive error information
        const { error: updateError } = await supabaseClient
          .from('function_schedules')
          .update({
            consecutive_failures: (schedule.consecutive_failures || 0) + 1,
            last_error: error.message,
            error_context: JSON.stringify({
              error_message: error.message,
              error_stack: error.stack,
              timestamp: new Date().toISOString(),
              schedule_context: {
                frequency_type: schedule.frequency_type,
                last_execution: schedule.last_execution_at,
                consecutive_failures: (schedule.consecutive_failures || 0) + 1
              }
            })
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