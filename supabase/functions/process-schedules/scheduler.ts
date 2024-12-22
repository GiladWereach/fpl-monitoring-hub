import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Schedule, ProcessedSchedule } from './types.ts';
import { processSchedule } from './schedule-processor.ts';
import { logDebug, logError } from '../shared/logging-service.ts';

async function getActiveFixtures(supabaseClient: ReturnType<typeof createClient>) {
  const { data: fixtures, error } = await supabaseClient
    .from('fixtures')
    .select('*')
    .eq('started', true)
    .eq('finished', false);

  if (error) {
    logError('process-schedules', 'Error fetching active fixtures:', error);
    throw error;
  }

  return fixtures || [];
}

async function getCurrentEvent(supabaseClient: ReturnType<typeof createClient>) {
  const { data: event, error } = await supabaseClient
    .from('events')
    .select('*')
    .eq('is_current', true)
    .single();

  if (error) {
    logError('process-schedules', 'Error fetching current event:', error);
    throw error;
  }

  return event;
}

async function determineScheduleInterval(
  supabaseClient: ReturnType<typeof createClient>,
  schedule: Schedule
): Promise<number> {
  logDebug('process-schedules', `Determining interval for schedule: ${schedule.function_name}`);

  if (schedule.schedule_type !== 'match_dependent') {
    return schedule.base_interval_minutes || 1440; // Default to daily
  }

  const activeFixtures = await getActiveFixtures(supabaseClient);
  const currentEvent = await getCurrentEvent(supabaseClient);

  if (!currentEvent) {
    logDebug('process-schedules', 'No current event found, using non-match interval');
    return schedule.non_match_interval_minutes || 1440;
  }

  if (activeFixtures.length > 0) {
    logDebug('process-schedules', `Active matches found (${activeFixtures.length}), using match-day interval`);
    return schedule.match_day_interval_minutes || 2;
  }

  // Check if we're in a live gameweek
  const { data: unfinishedFixtures } = await supabaseClient
    .from('fixtures')
    .select('*')
    .eq('event', currentEvent.id)
    .eq('finished', false);

  if (unfinishedFixtures && unfinishedFixtures.length > 0) {
    logDebug('process-schedules', 'Live gameweek period, using non-match interval');
    return schedule.non_match_interval_minutes || 30;
  }

  logDebug('process-schedules', 'No live matches or gameweek, using daily intervals');
  return 1440; // Default to daily
}

export const processSchedules = async (supabaseClient: ReturnType<typeof createClient>) => {
  logDebug('process-schedules', 'Starting schedule processing...');
  
  try {
    const { data: activeSchedules, error: schedulesError } = await supabaseClient
      .from('schedules')
      .select('*')
      .eq('enabled', true)
      .or('next_execution_at.is.null,next_execution_at.lte.now()');

    if (schedulesError) {
      logError('process-schedules', 'Error fetching schedules:', schedulesError);
      throw schedulesError;
    }

    logDebug('process-schedules', `Found ${activeSchedules?.length || 0} active schedules to process`);
    const processedSchedules: ProcessedSchedule[] = [];

    for (const schedule of (activeSchedules || [])) {
      try {
        const interval = await determineScheduleInterval(supabaseClient, schedule);
        logDebug('process-schedules', `Determined interval for ${schedule.function_name}: ${interval} minutes`);
        
        const result = await processSchedule(supabaseClient, {
          ...schedule,
          current_interval: interval
        });
        processedSchedules.push(result);
        
        // Update next execution time based on determined interval
        const nextExecution = new Date();
        nextExecution.setMinutes(nextExecution.getMinutes() + interval);
        
        await supabaseClient
          .from('schedules')
          .update({
            last_execution_at: new Date().toISOString(),
            next_execution_at: nextExecution.toISOString()
          })
          .eq('id', schedule.id);

        logDebug('process-schedules', `Successfully processed ${schedule.function_name}, next run at ${nextExecution.toISOString()}`);
      } catch (error) {
        logError('process-schedules', `Failed to process schedule ${schedule.id}:`, error);
      }
    }

    return processedSchedules;
  } catch (error) {
    logError('process-schedules', 'Fatal error in processSchedules:', error);
    throw error;
  }
};