import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface ScheduleWindow {
  intervalMinutes: number;
  reason: string;
}

export async function determineScheduleWindow(
  supabaseClient: ReturnType<typeof createClient>,
  functionName: string
): Promise<ScheduleWindow> {
  console.log(`[${functionName}] Determining schedule window...`);
  
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
      console.log(`[${functionName}] Active matches found, using 2-minute intervals`);
      return {
        intervalMinutes: 2,
        reason: 'Live matches in progress'
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
        console.log(`[${functionName}] Within 3-hour post-match window, using 30-minute intervals`);
        return {
          intervalMinutes: 30,
          reason: 'Post-match window (within 3 hours of match completion)'
        };
      }
    }

    // Default to daily updates
    console.log(`[${functionName}] Outside match and post-match windows, using daily intervals`);
    return {
      intervalMinutes: 1440, // 24 hours
      reason: 'No recent or upcoming matches'
    };
  } catch (error) {
    console.error(`[${functionName}] Error determining schedule window:`, error);
    // Default to 30 minutes if there's an error, to be safe
    return {
      intervalMinutes: 30,
      reason: 'Error occurred, using safe default interval'
    };
  }
}