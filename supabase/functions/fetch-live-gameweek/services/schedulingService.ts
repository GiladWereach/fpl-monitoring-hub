import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../logging.ts';
import { addMinutes, isAfter, isBefore } from 'date-fns';

export interface ScheduleWindow {
  intervalMinutes: number;
  reason: string;
  nextCheck?: Date;
}

export async function determineScheduleWindow(
  supabaseClient: ReturnType<typeof createClient>,
  functionName: string
): Promise<ScheduleWindow> {
  logDebug(functionName, 'Determining schedule window...');
  
  try {
    // Get current gameweek
    const { data: currentEvent, error: eventError } = await supabaseClient
      .from('events')
      .select('*')
      .eq('is_current', true)
      .single();

    if (eventError) throw eventError;
    
    if (!currentEvent) {
      return {
        intervalMinutes: 1440, // Check daily if no current gameweek
        reason: 'No current gameweek found'
      };
    }

    const now = new Date();
    const deadlineTime = new Date(currentEvent.deadline_time);
    const postDeadlineCheck = addMinutes(deadlineTime, 45);

    // If we're in the 45-minute post-deadline window
    if (isAfter(now, deadlineTime) && isBefore(now, postDeadlineCheck)) {
      return {
        intervalMinutes: 15,
        reason: 'Post-deadline initial checks',
        nextCheck: addMinutes(now, 15)
      };
    }

    // Check for active matches
    const { data: activeMatches } = await supabaseClient
      .from('fixtures')
      .select('*')
      .eq('event', currentEvent.id)
      .eq('started', true)
      .eq('finished', false);

    if (activeMatches && activeMatches.length > 0) {
      logDebug(functionName, `Found ${activeMatches.length} active matches`);
      return {
        intervalMinutes: 2,
        reason: 'Active matches in progress',
        nextCheck: addMinutes(now, 2)
      };
    }

    // Check for upcoming matches in next hour
    const { data: upcomingMatches } = await supabaseClient
      .from('fixtures')
      .select('*')
      .eq('event', currentEvent.id)
      .eq('started', false)
      .eq('finished', false)
      .gt('kickoff_time', now.toISOString())
      .order('kickoff_time', { ascending: true })
      .limit(1);

    if (upcomingMatches && upcomingMatches.length > 0) {
      const kickoffTime = new Date(upcomingMatches[0].kickoff_time);
      const timeToKickoff = Math.floor((kickoffTime.getTime() - now.getTime()) / (1000 * 60));

      if (timeToKickoff <= 60) {
        return {
          intervalMinutes: 15,
          reason: 'Approaching match kickoff',
          nextCheck: addMinutes(now, 15)
        };
      }
    }

    // Default to 30-minute checks during active gameweek
    return {
      intervalMinutes: 30,
      reason: 'Active gameweek - between matches',
      nextCheck: addMinutes(now, 30)
    };
  } catch (error) {
    logError(functionName, 'Error determining schedule window:', error);
    // Default to safe 30-minute interval on error
    return {
      intervalMinutes: 30,
      reason: 'Error occurred, using safe default interval'
    };
  }
}