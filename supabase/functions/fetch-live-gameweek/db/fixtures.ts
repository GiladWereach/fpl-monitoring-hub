import { getSupabaseClient } from './client.ts';

export async function getActiveFixtures(supabaseClient: any, eventId: number) {
  console.log(`Fetching active fixtures for event ${eventId}`);
  const { data: activeFixtures, error: fixturesError } = await supabaseClient
    .from('fixtures')
    .select('*')
    .eq('event', eventId)
    .eq('started', true)
    .eq('finished', false);

  if (fixturesError) {
    console.error('Error fetching active fixtures:', fixturesError);
    throw fixturesError;
  }
  
  console.log(`Found ${activeFixtures?.length || 0} active fixtures`);
  return activeFixtures || [];
}

export async function getFixtureStatus(supabaseClient: any, eventId: number) {
  console.log(`Checking fixture status for event ${eventId}`);
  const { data: fixtures, error } = await supabaseClient
    .from('fixtures')
    .select('started, finished')
    .eq('event', eventId);

  if (error) {
    console.error('Error fetching fixtures:', error);
    throw error;
  }

  const hasActiveFixtures = fixtures.some(f => f.started && !f.finished);
  const allFixturesFinished = fixtures.every(f => f.finished);

  return { hasActiveFixtures, allFixturesFinished };
}