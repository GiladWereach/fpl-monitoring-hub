import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../shared/logging-service.ts';

export interface MatchStatus {
  hasActiveMatches: boolean;
  nextMatchTime: Date | null;
  isMatchDay: boolean;
  matchDayWindow: {
    start: Date | null;
    end: Date | null;
  };
}

export async function getMatchStatus(supabaseClient: ReturnType<typeof createClient>): Promise<MatchStatus> {
  logDebug('match-service', 'Checking match status...');
  
  try {
    const now = new Date();
    
    // Check for active matches
    const { data: activeMatches, error: activeError } = await supabaseClient
      .from('fixtures')
      .select('*')
      .eq('started', true)
      .eq('finished', false)
      .order('kickoff_time', { ascending: true });

    if (activeError) {
      logError('match-service', 'Error checking active matches:', activeError);
      throw activeError;
    }

    // Check for upcoming matches
    const { data: upcomingMatches, error: upcomingError } = await supabaseClient
      .from('fixtures')
      .select('*')
      .gt('kickoff_time', now.toISOString())
      .order('kickoff_time', { ascending: true })
      .limit(1);

    if (upcomingError) {
      logError('match-service', 'Error checking upcoming matches:', upcomingError);
      throw upcomingError;
    }

    const hasActiveMatches = activeMatches && activeMatches.length > 0;
    const nextMatchTime = upcomingMatches?.[0]?.kickoff_time ? new Date(upcomingMatches[0].kickoff_time) : null;

    let matchDayWindow = {
      start: null as Date | null,
      end: null as Date | null
    };

    if (hasActiveMatches) {
      const firstMatch = new Date(activeMatches[0].kickoff_time);
      const lastMatch = new Date(activeMatches[activeMatches.length - 1].kickoff_time);
      const windowEnd = new Date(lastMatch);
      windowEnd.setHours(windowEnd.getHours() + 2.5); // 2.5 hours after last kickoff

      matchDayWindow = {
        start: firstMatch,
        end: windowEnd
      };
    }

    const isMatchDay = hasActiveMatches || (nextMatchTime && 
      ((nextMatchTime.getTime() - now.getTime()) <= 2 * 60 * 60 * 1000)); // Within 2 hours of next match

    logDebug('match-service', `Match status: Active matches: ${hasActiveMatches}, Is match day: ${isMatchDay}, Next match: ${nextMatchTime}`);

    return {
      hasActiveMatches,
      nextMatchTime,
      isMatchDay,
      matchDayWindow
    };
  } catch (error) {
    logError('match-service', 'Error in getMatchStatus:', error);
    throw error;
  }
}