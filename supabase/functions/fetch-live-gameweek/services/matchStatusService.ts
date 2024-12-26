import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../logging.ts';

export interface MatchStatus {
  hasActiveMatches: boolean;
  matchDayWindow: {
    start: Date | null;
    end: Date | null;
  };
  isMatchDay: boolean;
  hasPostponedMatches: boolean;
  nextScheduledMatch: Date | null;
}

export async function getMatchStatus(): Promise<MatchStatus> {
  console.log('Checking match status...');
  
  const now = new Date();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Check for active and postponed matches
    const { data: fixtures, error } = await supabase
      .from('fixtures')
      .select('*')
      .or('started.eq.true,postponed.eq.true')
      .order('kickoff_time', { ascending: true });

    if (error) {
      logError('match-status-service', 'Error fetching fixtures:', error);
      throw error;
    }

    const activeMatches = fixtures?.filter(f => f.started && !f.finished) || [];
    const postponedMatches = fixtures?.filter(f => f.postponed) || [];

    // Get next scheduled match
    const { data: nextMatch } = await supabase
      .from('fixtures')
      .select('kickoff_time')
      .eq('postponed', false)
      .gt('kickoff_time', now.toISOString())
      .order('kickoff_time', { ascending: true })
      .limit(1)
      .single();

    // Determine match day window
    let matchDayWindow = {
      start: null as Date | null,
      end: null as Date | null
    };

    if (activeMatches.length > 0) {
      const firstMatch = new Date(activeMatches[0].kickoff_time);
      const lastMatch = new Date(activeMatches[activeMatches.length - 1].kickoff_time);
      const windowEnd = new Date(lastMatch);
      windowEnd.setHours(windowEnd.getHours() + 2.5); // 2.5 hours after last kickoff

      matchDayWindow = {
        start: firstMatch,
        end: windowEnd
      };

      logDebug('match-status-service', `Match day window: ${firstMatch.toISOString()} to ${windowEnd.toISOString()}`);
    }

    const status: MatchStatus = {
      hasActiveMatches: activeMatches.length > 0,
      matchDayWindow,
      isMatchDay: activeMatches.length > 0 || (nextMatch?.kickoff_time && 
        new Date(nextMatch.kickoff_time).getTime() - now.getTime() <= 2 * 60 * 60 * 1000),
      hasPostponedMatches: postponedMatches.length > 0,
      nextScheduledMatch: nextMatch?.kickoff_time ? new Date(nextMatch.kickoff_time) : null
    };

    logDebug('match-status-service', 'Match status determined:', status);
    return status;
  } catch (error) {
    logError('match-status-service', 'Error in getMatchStatus:', error);
    throw error;
  }
}