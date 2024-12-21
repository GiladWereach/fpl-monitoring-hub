import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logError, logInfo } from './logging.ts';

export async function upsertFixtures(supabaseClient: ReturnType<typeof createClient>, fixtures: any[]) {
  logInfo('fetch-fixtures', `Upserting ${fixtures.length} fixtures`);
  
  const { error: fixturesError } = await supabaseClient
    .from('fixtures')
    .upsert(fixtures.map(fixture => ({
      ...fixture,
      last_updated: new Date().toISOString()
    })));

  if (fixturesError) {
    logError('fetch-fixtures', 'Error upserting fixtures:', fixturesError);
    throw fixturesError;
  }

  logInfo('fetch-fixtures', 'Fixtures upserted successfully');
}