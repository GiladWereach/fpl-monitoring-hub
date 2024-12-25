import { supabase } from '../db/client.ts';

export interface MatchWindow {
  start: Date;
  end: Date;
  hasActiveMatches: boolean;
}

export async function determineExecutionFrequency(): Promise<number> {
  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('*')
    .eq('started', true)
    .eq('finished', false);

  // If we have active matches, check every 2 minutes
  if (fixtures && fixtures.length > 0) {
    console.log('Active matches found, using 2 minute interval');
    return 2;
  }

  // Check for upcoming matches in the next hour
  const oneHourFromNow = new Date();
  oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

  const { data: upcomingFixtures } = await supabase
    .from('fixtures')
    .select('*')
    .eq('started', false)
    .lte('kickoff_time', oneHourFromNow.toISOString());

  // If we have upcoming matches within an hour, check every 5 minutes
  if (upcomingFixtures && upcomingFixtures.length > 0) {
    console.log('Upcoming matches found, using 5 minute interval');
    return 5;
  }

  // Default to checking every 30 minutes outside of match windows
  console.log('No active or upcoming matches, using 30 minute interval');
  return 30;
}

export async function getMatchWindow(): Promise<MatchWindow | null> {
  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('*')
    .or('started.eq.true,finished.eq.false')
    .order('kickoff_time', { ascending: true });

  if (!fixtures || fixtures.length === 0) {
    return null;
  }

  const firstMatch = new Date(fixtures[0].kickoff_time);
  const lastMatch = new Date(fixtures[fixtures.length - 1].kickoff_time);
  const windowEnd = new Date(lastMatch);
  windowEnd.setHours(windowEnd.getHours() + 2); // 2 hours after last kickoff

  return {
    start: firstMatch,
    end: windowEnd,
    hasActiveMatches: fixtures.some(f => f.started && !f.finished)
  };
}