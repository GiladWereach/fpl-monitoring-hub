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
      
      // Create execution log
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

      // Update next execution time
      const { error: nextTimeError } = await supabaseClient
        .rpc('update_next_execution_time', {
          schedule_id: schedule.id,
          execution_time: new Date().toISOString()
        });

      if (nextTimeError) {
        console.error('Error updating next execution time:', nextTimeError);
      }

      processedSchedules.push(schedule.id);
      console.log(`Successfully processed schedule ${schedule.id}`);

    } catch (error) {
      console.error(`Error processing schedule ${schedule.id}:`, error);
    }
  }

  return processedSchedules;
};