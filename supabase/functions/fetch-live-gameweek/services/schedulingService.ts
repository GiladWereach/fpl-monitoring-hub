import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../logging.ts';
import { getMatchStatus } from './matchStatusService.ts';
import { addMinutes, isAfter, isBefore } from 'date-fns';

export interface ScheduleWindow {
  intervalMinutes: number;
  reason: string;
  nextCheck?: Date;
  matchStatus?: {
    hasActiveMatches: boolean;
    isPostMatch: boolean;
    nextMatchTime?: Date;
  };
}

export async function determineScheduleWindow(
  supabaseClient: ReturnType<typeof createClient>,
  functionName: string
): Promise<ScheduleWindow> {
  logDebug(functionName, 'Determining schedule window...');
  
  try {
    // Get current gameweek and match status
    const { data: currentEvent } = await supabaseClient
      .from('events')
      .select('*')
      .eq('is_current', true)
      .single();

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

    // Get match status
    const matchStatus = await getMatchStatus();
    
    if (matchStatus.hasActiveMatches) {
      logDebug(functionName, 'Active matches found, using 1-minute interval');
      return {
        intervalMinutes: 1, // Reduced from 2 to 1 minute
        reason: 'Active matches in progress',
        nextCheck: addMinutes(now, 1),
        matchStatus: {
          hasActiveMatches: true,
          isPostMatch: false
        }
      };
    }

    // Handle postponed matches
    if (matchStatus.hasPostponedMatches) {
      logDebug(functionName, 'Postponed matches found, adjusting schedule');
      return {
        intervalMinutes: 30,
        reason: 'Monitoring postponed matches',
        nextCheck: addMinutes(now, 30),
        matchStatus: {
          hasActiveMatches: false,
          isPostMatch: false
        }
      };
    }

    // Check for upcoming matches
    if (matchStatus.nextScheduledMatch) {
      const timeToKickoff = Math.floor(
        (matchStatus.nextScheduledMatch.getTime() - now.getTime()) / (1000 * 60)
      );

      if (timeToKickoff <= 60) {
        return {
          intervalMinutes: 15,
          reason: 'Approaching match kickoff',
          nextCheck: addMinutes(now, 15),
          matchStatus: {
            hasActiveMatches: false,
            isPostMatch: false,
            nextMatchTime: matchStatus.nextScheduledMatch
          }
        };
      }
    }

    // Default to 30-minute checks during active gameweek
    return {
      intervalMinutes: 30,
      reason: 'Active gameweek - between matches',
      nextCheck: addMinutes(now, 30),
      matchStatus: {
        hasActiveMatches: false,
        isPostMatch: false,
        nextMatchTime: matchStatus.nextScheduledMatch
      }
    };
  } catch (error) {
    logError(functionName, 'Error determining schedule window:', error);
    // Default to safe 30-minute interval on error
    return {
      intervalMinutes: 30,
      reason: 'Error occurred, using safe default interval',
      matchStatus: {
        hasActiveMatches: false,
        isPostMatch: false
      }
    };
  }
}