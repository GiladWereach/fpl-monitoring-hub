import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { LivePerformanceUpdate } from '../types.ts';
import { logDebug, logError } from '../logging.ts';

export async function upsertLivePerformance(
  supabaseClient: ReturnType<typeof createClient>,
  updates: LivePerformanceUpdate[]
) {
  if (!updates.length) {
    logDebug('fetch-live-gameweek', 'No updates to process');
    return;
  }

  const playerIds = [...new Set(updates.map(u => u.player_id))];
  const validPlayerIds = await validatePlayers(supabaseClient, playerIds);
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
}

async function validatePlayers(supabaseClient: ReturnType<typeof createClient>, playerIds: number[]) {
  logDebug('fetch-live-gameweek', `Validating ${playerIds.length} players...`);
  
  const { data: existingPlayers, error } = await supabaseClient
    .from('players')
    .select('id')
    .in('id', playerIds);

  if (error) {
    logError('fetch-live-gameweek', 'Error validating players:', error);
    throw error;
  }

  const validPlayerIds = new Set(existingPlayers.map(p => p.id));
  logDebug('fetch-live-gameweek', `Found ${validPlayerIds.size} valid players out of ${playerIds.length}`);
  
  return validPlayerIds;
}