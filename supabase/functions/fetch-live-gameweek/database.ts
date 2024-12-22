import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { LivePerformanceUpdate } from './types.ts';
import { getCurrentEvent, checkGameweekTransition } from './db/events.ts';
import { getActiveFixtures, getFixtureStatus } from './db/fixtures.ts';
import { getLastUpdate, cleanupOldPerformanceData } from './db/performance.ts';
import { validatePlayers, validateGameweek } from './db/validation.ts';
import { recordMetrics } from './db/metrics.ts';
import { logDebug, logError } from './logging.ts';

export async function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

export async function upsertLivePerformance(
  supabaseClient: ReturnType<typeof createClient>,
  updates: LivePerformanceUpdate[]
) {
  if (!updates.length) {
    logDebug('fetch-live-gameweek', 'No updates to process');
    return;
  }

  const startTime = Date.now();

  // Validate players first
  const playerIds = [...new Set(updates.map(u => u.player_id))];
  const validPlayerIds = await validatePlayers(supabaseClient, playerIds);

  // Filter out updates for invalid player IDs
  const validUpdates = updates.filter(update => validPlayerIds.has(update.player_id));
  logDebug('fetch-live-gameweek', `Processing ${validUpdates.length} valid updates out of ${updates.length} total`);

  if (!validUpdates.length) {
    logDebug('fetch-live-gameweek', 'No valid updates to process after filtering');
    return;
  }

  const batchSize = 50;
  for (let i = 0; i < validUpdates.length; i += batchSize) {
    const batch = validUpdates.slice(i, i + batchSize);
    logDebug('fetch-live-gameweek', `Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(validUpdates.length/batchSize)}`);
    
    const { error: upsertError } = await supabaseClient
      .from('gameweek_live_performance')
      .upsert(batch, {
        onConflict: 'event_id,player_id',
        ignoreDuplicates: false
      });

    if (upsertError) {
      logError('fetch-live-gameweek', `Error upserting batch ${Math.floor(i/batchSize) + 1}:`, upsertError);
      throw upsertError;
    }
  }

  // Record metrics
  await recordMetrics(supabaseClient, updates[0].event_id, {
    processedPlayers: validUpdates.length,
    updatedRecords: validUpdates.length,
    processingTimeMs: Date.now() - startTime
  });
}

export async function shouldProcessGameweek(
  supabaseClient: ReturnType<typeof createClient>, 
  eventId: number
): Promise<boolean> {
  try {
    logDebug('fetch-live-gameweek', `Checking if gameweek ${eventId} should be processed...`);
    
    // First check if we need to transition to a new gameweek
    const currentEvent = await checkGameweekTransition(supabaseClient);
    
    // Basic validation
    if (!await validateGameweek(supabaseClient, eventId)) {
      return false;
    }

    // Check fixture status
    const { hasActiveFixtures, allFixturesFinished } = await getFixtureStatus(supabaseClient, eventId);

    // If any fixture is started but not finished, we should process
    if (hasActiveFixtures) {
      logDebug('fetch-live-gameweek', `Gameweek ${eventId} has active fixtures, should process`);
      return true;
    }

    // If all fixtures are finished, check if we need one final update
    if (allFixturesFinished) {
      const lastUpdate = await getLastUpdate(supabaseClient, eventId);
      
      // If we haven't updated in the last hour after all fixtures finished,
      // do one final update
      if (!lastUpdate?.last_updated || 
          (Date.now() - new Date(lastUpdate.last_updated).getTime() > 60 * 60 * 1000)) {
        logDebug('fetch-live-gameweek', `Performing final update for gameweek ${eventId}`);
        
        // Clean up old performance data
        await cleanupOldPerformanceData(supabaseClient, eventId);
        return true;
      }
    }

    logDebug('fetch-live-gameweek', `No processing needed for gameweek ${eventId}`);
    return false;
  } catch (error) {
    logError('fetch-live-gameweek', 'Error checking if gameweek should be processed:', error);
    return false;
  }
}