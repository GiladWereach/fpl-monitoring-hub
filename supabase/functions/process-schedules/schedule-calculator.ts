import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../../shared/logging-service.ts';

export async function calculateNextExecutionTime(
  supabaseClient: ReturnType<typeof createClient>,
  schedule: any,
  currentTime: Date = new Date()
): Promise<Date> {
  logDebug('schedule-calculator', `Calculating next execution for ${schedule.function_name}`);

  try {
    let intervalMinutes: number;

    if (schedule.schedule_type === 'time_based') {
      if (schedule.time_config?.type === 'interval') {
        intervalMinutes = schedule.time_config.intervalMinutes || 1440;
        logDebug('schedule-calculator', `Using interval of ${intervalMinutes} minutes`);
      } else if (schedule.time_config?.type === 'daily') {
        const nextRun = new Date(currentTime);
        const [hours, minutes] = (schedule.time_config.hour || '03:00').split(':').map(Number);
        nextRun.setHours(hours, minutes, 0, 0);
        if (nextRun <= currentTime) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        logDebug('schedule-calculator', `Daily schedule, next run at ${nextRun.toISOString()}`);
        return nextRun;
      }
    } else if (schedule.schedule_type === 'event_based') {
      // For event-based schedules, check if we're in an active match window
      const matchStatus = await getMatchStatus(supabaseClient);
      
      if (matchStatus.hasActiveMatches) {
        intervalMinutes = 2; // During active matches, check every 2 minutes
        logDebug('schedule-calculator', 'Active matches found, using 2 minute interval');
      } else if (matchStatus.isMatchDay) {
        intervalMinutes = 30; // On match days but outside active matches
        logDebug('schedule-calculator', 'Match day but no active matches, using 30 minute interval');
      } else {
        intervalMinutes = 1440; // Default to daily on non-match days
        logDebug('schedule-calculator', 'No matches, using daily interval');
      }
    }

    const nextRun = new Date(currentTime);
    nextRun.setMinutes(nextRun.getMinutes() + intervalMinutes);
    
    logDebug('schedule-calculator', `Next execution for ${schedule.function_name} calculated as ${nextRun.toISOString()}`);
    return nextRun;
  } catch (error) {
    logError('schedule-calculator', `Error calculating next execution for ${schedule.function_name}:`, error);
    throw error;
  }
}

async function getMatchStatus(supabaseClient: ReturnType<typeof createClient>) {
  try {
    // Check for active matches
    const { data: activeMatches, error: matchError } = await supabaseClient
      .from('fixtures')
      .select('*')
      .eq('started', true)
      .eq('finished', false);

    if (matchError) throw matchError;

    // Check for upcoming matches within 2 hours
    const twoHoursFromNow = new Date();
    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);

    const { data: upcomingMatches, error: upcomingError } = await supabaseClient
      .from('fixtures')
      .select('*')
      .eq('started', false)
      .lte('kickoff_time', twoHoursFromNow.toISOString());

    if (upcomingError) throw upcomingError;

    return {
      hasActiveMatches: activeMatches && activeMatches.length > 0,
      isMatchDay: (activeMatches && activeMatches.length > 0) || (upcomingMatches && upcomingMatches.length > 0)
    };
  } catch (error) {
    logError('schedule-calculator', 'Error getting match status:', error);
    throw error;
  }
}