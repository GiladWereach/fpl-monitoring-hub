import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug } from './logging-service.ts';

export interface ScheduleWindow {
  intervalMinutes: number;
  reason: string;
  matchStatus: {
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
    // Check for active matches
    const { data: activeMatches, error: matchError } = await supabaseClient
      .from('fixtures')
      .select('*')
      .eq('started', true)
      .eq('finished', false);

    if (matchError) {
      console.error(`[${functionName}] Error checking active matches:`, matchError);
      throw matchError;
    }

    if (activeMatches && activeMatches.length > 0) {
      logDebug(functionName, `Found ${activeMatches.length} active matches`);
      return {
        intervalMinutes: 2,
        reason: 'Live matches in progress',
        matchStatus: {
          hasActiveMatches: true,
          isPostMatch: false
        }
      };
    }

    // Check if we're in post-match window (within 3 hours of last finished match)
    const { data: recentMatches, error: recentError } = await supabaseClient
      .from('fixtures')
      .select('*')
      .eq('finished', true)
      .order('kickoff_time', { ascending: false })
      .limit(1);

    if (recentError) {
      console.error(`[${functionName}] Error checking recent matches:`, recentError);
      throw recentError;
    }

    if (recentMatches && recentMatches.length > 0) {
      const lastMatch = recentMatches[0];
      const matchEndTime = new Date(lastMatch.kickoff_time);
      matchEndTime.setMinutes(matchEndTime.getMinutes() + 90); // Approximate match end time
      
      const threeHoursAfterMatch = new Date(matchEndTime);
      threeHoursAfterMatch.setHours(threeHoursAfterMatch.getHours() + 3);
      
      if (new Date() <= threeHoursAfterMatch) {
        logDebug(functionName, 'Within 3-hour post-match window');
        return {
          intervalMinutes: 30,
          reason: 'Post-match window (within 3 hours of match completion)',
          matchStatus: {
            hasActiveMatches: false,
            isPostMatch: true
          }
        };
      }
    }

    // Check for upcoming matches
    const { data: upcomingMatches, error: upcomingError } = await supabaseClient
      .from('fixtures')
      .select('*')
      .gt('kickoff_time', new Date().toISOString())
      .order('kickoff_time')
      .limit(1);

    if (upcomingError) {
      console.error(`[${functionName}] Error checking upcoming matches:`, upcomingError);
      throw upcomingError;
    }

    // Default to daily updates with next match info if available
    logDebug(functionName, 'No active or recent matches');
    return {
      intervalMinutes: 1440, // 24 hours
      reason: 'Outside match and post-match windows',
      matchStatus: {
        hasActiveMatches: false,
        isPostMatch: false,
        nextMatchTime: upcomingMatches?.[0]?.kickoff_time ? new Date(upcomingMatches[0].kickoff_time) : undefined
      }
    };
  } catch (error) {
    console.error(`[${functionName}] Error determining schedule window:`, error);
    // Default to 30 minutes if there's an error, to be safe
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