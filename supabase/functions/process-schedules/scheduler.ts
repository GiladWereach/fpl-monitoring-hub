import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Schedule } from './types.ts';

export const calculateNextExecution = (schedule: Schedule, now: Date): Date => {
  const nextExecution = new Date(now);

  if (!schedule.time_config) return nextExecution;

  switch (schedule.time_config.type) {
    case 'interval':
      if (schedule.time_config.intervalMinutes) {
        nextExecution.setMinutes(nextExecution.getMinutes() + schedule.time_config.intervalMinutes);
      }
      break;

    case 'daily':
      if (typeof schedule.time_config.hour === 'number') {
        nextExecution.setHours(schedule.time_config.hour, 0, 0, 0);
        if (nextExecution <= now) {
          nextExecution.setDate(nextExecution.getDate() + 1);
        }
      }
      break;

    // Add other schedule types as needed
  }

  return nextExecution;
};

export const processSchedules = async (supabaseClient: ReturnType<typeof createClient>) => {
  console.log('Fetching enabled time-based schedules...');
  const { data: schedules, error: schedulesError } = await supabaseClient
    .from('schedules')
    .select('*')
    .eq('enabled', true)
    .eq('schedule_type', 'time_based');

  if (schedulesError) {
    console.error('Error fetching schedules:', schedulesError);
    throw schedulesError;
  }

  console.log(`Found ${schedules?.length} enabled schedules`);
  const processedSchedules = [];
  const now = new Date();

  for (const schedule of (schedules as Schedule[] || [])) {
    try {
      if (!schedule.next_execution_at) {
        console.log(`Initializing next_execution_at for schedule ${schedule.id}`);
        const nextExecution = calculateNextExecution(schedule, now);
        const { error: updateError } = await supabaseClient
          .from('schedules')
          .update({
            next_execution_at: nextExecution.toISOString()
          })
          .eq('id', schedule.id);

        if (updateError) {
          console.error(`Error updating next_execution_at for schedule ${schedule.id}:`, updateError);
          continue;
        }
        console.log(`Set initial next_execution_at to ${nextExecution.toISOString()}`);
        continue;
      }

      const nextExecutionDate = new Date(schedule.next_execution_at);
      if (nextExecutionDate > now) {
        console.log(`Schedule ${schedule.id} next execution at ${nextExecutionDate.toISOString()} is in the future, skipping...`);
        continue;
      }

      await executeSchedule(supabaseClient, schedule, now);
      processedSchedules.push(schedule.id);
      console.log(`Successfully processed schedule ${schedule.id}`);
    } catch (error) {
      console.error(`Error processing schedule ${schedule.id}:`, error);
    }
  }

  return processedSchedules;
};

const executeSchedule = async (
  supabaseClient: ReturnType<typeof createClient>,
  schedule: Schedule,
  now: Date
) => {
  console.log(`Executing schedule ${schedule.id} for function ${schedule.function_name}`);

  // Log execution start
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
    return;
  }

  // Invoke the function
  const startTime = Date.now();
  console.log(`Invoking function ${schedule.function_name}`);
  const { error: invokeError } = await supabaseClient.functions.invoke(
    schedule.function_name,
    {
      body: { scheduled: true }
    }
  );

  if (invokeError) {
    console.error(`Error invoking function ${schedule.function_name}:`, invokeError);
  }

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

  // Calculate and update next execution time
  const nextExecution = calculateNextExecution(schedule, now);
  const { error: scheduleUpdateError } = await supabaseClient
    .from('schedules')
    .update({
      last_execution_at: now.toISOString(),
      next_execution_at: nextExecution.toISOString()
    })
    .eq('id', schedule.id);

  if (scheduleUpdateError) {
    console.error('Error updating schedule execution times:', scheduleUpdateError);
  } else {
    console.log(`Updated schedule ${schedule.id} with next execution at ${nextExecution.toISOString()}`);
  }
};