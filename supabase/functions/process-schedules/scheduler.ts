import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Schedule } from './types.ts';

export const processSchedules = async (supabaseClient: ReturnType<typeof createClient>) => {
  console.log('Fetching active schedules...');
  const { data: activeSchedules, error: schedulesError } = await supabaseClient
    .rpc('get_active_schedules');

  if (schedulesError) {
    console.error('Error fetching schedules:', schedulesError);
    throw schedulesError;
  }

  console.log(`Found ${activeSchedules?.length} active schedules`);
  const processedSchedules = [];

  for (const schedule of (activeSchedules as Schedule[] || [])) {
    try {
      console.log(`Processing schedule ${schedule.id} for function ${schedule.function_name}`);
      
      // First ensure the schedule exists in the schedules table
      const { data: existingSchedule, error: checkError } = await supabaseClient
        .from('schedules')
        .select('id')
        .eq('function_name', schedule.function_name)
        .single();

      if (checkError || !existingSchedule) {
        console.log(`Creating schedule record for ${schedule.function_name}`);
        
        // Prepare schedule configuration based on type
        const scheduleConfig = {
          function_name: schedule.function_name,
          schedule_type: 'event_based',
          enabled: true,
          event_config: {
            triggerType: 'match_status',
            offsetMinutes: 0
          },
          execution_config: {
            retry_count: 3,
            timeout_seconds: 30,
            retry_delay_seconds: 60,
            concurrent_execution: false,
            retry_backoff: 'linear',
            max_retry_delay: 3600
          },
          event_conditions: [
            {
              field: "gameweek_active",
              operator: "eq",
              value: "true"
            }
          ],
          execution_window: {
            start_time: "-6 hours",
            end_time: "+6 hours"
          }
        };

        const { data: newSchedule, error: createError } = await supabaseClient
          .from('schedules')
          .insert(scheduleConfig)
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating schedule:', createError);
          continue;
        }
        
        console.log(`Created schedule with id ${newSchedule.id}`);
        
        // Create execution log with the new schedule id
        const { data: log, error: logError } = await supabaseClient
          .from('schedule_execution_logs')
          .insert({
            schedule_id: newSchedule.id,
            started_at: new Date().toISOString(),
            status: 'running'
          })
          .select()
          .single();

        if (logError) {
          console.error('Error creating execution log:', logError);
          continue;
        }

        // Execute the function
        const startTime = Date.now();
        console.log(`Invoking function ${schedule.function_name}`);
        const { error: invokeError } = await supabaseClient.functions.invoke(
          schedule.function_name,
          {
            body: { scheduled: true }
          }
        );

        // Update execution log
        if (log) {
          const { error: logUpdateError } = await supabaseClient
            .from('schedule_execution_logs')
            .update({
              completed_at: new Date().toISOString(),
              status: invokeError ? 'failed' : 'completed',
              error_details: invokeError?.message,
              execution_duration_ms: Date.now() - startTime
            })
            .eq('id', log.id);

          if (logUpdateError) {
            console.error('Error updating execution log:', logUpdateError);
          }
        }

        processedSchedules.push(newSchedule.id);
        console.log(`Successfully processed schedule ${newSchedule.id}`);
      } else {
        // Use existing schedule id
        const { data: log, error: logError } = await supabaseClient
          .from('schedule_execution_logs')
          .insert({
            schedule_id: existingSchedule.id,
            started_at: new Date().toISOString(),
            status: 'running'
          })
          .select()
          .single();

        if (logError) {
          console.error('Error creating execution log:', logError);
          continue;
        }

        // Execute the function
        const startTime = Date.now();
        console.log(`Invoking function ${schedule.function_name}`);
        const { error: invokeError } = await supabaseClient.functions.invoke(
          schedule.function_name,
          {
            body: { scheduled: true }
          }
        );

        // Update execution log
        if (log) {
          const { error: logUpdateError } = await supabaseClient
            .from('schedule_execution_logs')
            .update({
              completed_at: new Date().toISOString(),
              status: invokeError ? 'failed' : 'completed',
              error_details: invokeError?.message,
              execution_duration_ms: Date.now() - startTime
            })
            .eq('id', log.id);

          if (logUpdateError) {
            console.error('Error updating execution log:', logUpdateError);
          }
        }

        processedSchedules.push(existingSchedule.id);
        console.log(`Successfully processed schedule ${existingSchedule.id}`);
      }

      // Update next execution time
      const { error: nextTimeError } = await supabaseClient
        .rpc('update_next_execution_time', {
          schedule_id: schedule.id,
          execution_time: new Date().toISOString()
        });

      if (nextTimeError) {
        console.error('Error updating next execution time:', nextTimeError);
      }

    } catch (error) {
      console.error(`Error processing schedule ${schedule.id}:`, error);
    }
  }

  return processedSchedules;
};