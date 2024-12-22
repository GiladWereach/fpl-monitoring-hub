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
    let matchStatus = null;

    // For match dependent schedules, check match status
    if (schedule.frequency_type === 'match_dependent') {
      matchStatus = await getMatchStatus(supabaseClient);
      
      if (matchStatus.hasActiveMatches) {
        intervalMinutes = schedule.match_day_interval_minutes || 2;
        logDebug('schedule-calculator', `Active matches found, using ${intervalMinutes} minute interval`);
      } else if (matchStatus.isMatchDay) {
        intervalMinutes = schedule.non_match_interval_minutes || 30;
        logDebug('schedule-calculator', `Match day but no active matches, using ${intervalMinutes} minute interval`);
      } else {
        intervalMinutes = schedule.base_interval_minutes || 1440; // Default to daily
        logDebug('schedule-calculator', `No matches, using ${intervalMinutes} minute interval`);
      }
    } else if (schedule.frequency_type === 'fixed_interval') {
      intervalMinutes = schedule.base_interval_minutes || 1440;
      logDebug('schedule-calculator', `Fixed interval schedule, using ${intervalMinutes} minute interval`);
    } else {
      // Daily schedule
      const nextRun = new Date(currentTime);
      nextRun.setHours(schedule.fixed_time?.split(':')[0] || 3, 0, 0, 0);
      if (nextRun <= currentTime) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      return nextRun;
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