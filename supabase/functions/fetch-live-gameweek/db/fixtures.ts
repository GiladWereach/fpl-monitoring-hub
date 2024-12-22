import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../logging.ts';

export async function getActiveFixtures(supabaseClient: ReturnType<typeof createClient>, eventId: number) {
  logDebug('fetch-live-gameweek', `Fetching active fixtures for event ${eventId}`);
  
  const { data: activeFixtures, error: fixturesError } = await supabaseClient
    .from('fixtures')
    .select('*')
    .eq('event', eventId)
    .eq('started', true)
    .eq('finished', false);

  if (fixturesError) {
    logError('fetch-live-gameweek', 'Error fetching active fixtures:', fixturesError);
    throw fixturesError;
  }
  
  logDebug('fetch-live-gameweek', `Found ${activeFixtures?.length || 0} active fixtures`);
  return activeFixtures || [];
}

export async function getFixtureStatus(supabaseClient: ReturnType<typeof createClient>, eventId: number) {
  logDebug('fetch-live-gameweek', `Checking fixture status for event ${eventId}`);
  
  const { data: fixtures, error } = await supabaseClient
    .from('fixtures')
    .select('started, finished')
    .eq('event', eventId);

  if (error) {
    logError('fetch-live-gameweek', 'Error fetching fixtures:', error);
    throw error;
  }

  const hasActiveFixtures = fixtures.some(f => f.started && !f.finished);
  const allFixturesFinished = fixtures.every(f => f.finished);

  return { hasActiveFixtures, allFixturesFinished };
}

export async function getUpcomingFixtures(supabaseClient: ReturnType<typeof createClient>, eventId: number) {
  const now = new Date();
  
  const { data: fixtures, error } = await supabaseClient
    .from('fixtures')
    .select('*')
    .eq('event', eventId)
    .gt('kickoff_time', now.toISOString())
    .order('kickoff_time', { ascending: true });

  if (error) {
    logError('fetch-live-gameweek', 'Error fetching upcoming fixtures:', error);
    throw error;
  }

  return fixtures || [];
}