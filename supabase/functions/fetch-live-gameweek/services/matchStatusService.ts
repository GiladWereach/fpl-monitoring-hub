import { supabase } from '../db/client';

export interface MatchStatus {
  hasActiveMatches: boolean;
  matchDayWindow: {
    start: Date | null;
    end: Date | null;
  };
  isMatchDay: boolean;
}

export async function getMatchStatus(): Promise<MatchStatus> {
  console.log('Checking match status...');
  
  const now = new Date();
  const { data: fixtures, error } = await supabase
    .from('fixtures')
    .select('*')
    .eq('started', true)
    .eq('finished', false)
    .order('kickoff_time', { ascending: true });

  if (error) {
    console.error('Error fetching fixtures:', error);
    throw error;
  }

  // If we have active matches, determine the collection window
  if (fixtures && fixtures.length > 0) {
    const firstMatch = new Date(fixtures[0].kickoff_time);
    const lastMatch = new Date(fixtures[fixtures.length - 1].kickoff_time);
    const windowEnd = new Date(lastMatch);
    windowEnd.setHours(windowEnd.getHours() + 2.5); // 2.5 hours after last kickoff

    return {
      hasActiveMatches: true,
      matchDayWindow: {
        start: firstMatch,
        end: windowEnd
      },
      isMatchDay: now >= firstMatch && now <= windowEnd
    };
  }

  return {
    hasActiveMatches: false,
    matchDayWindow: {
      start: null,
      end: null
    },
    isMatchDay: false
  };
}