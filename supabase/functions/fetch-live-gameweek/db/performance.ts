import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../logging.ts';
import { LivePerformanceUpdate } from '../types.ts';

export async function upsertLivePerformance(
  supabaseClient: ReturnType<typeof createClient>,
  updates: LivePerformanceUpdate[]
) {
  if (!updates.length) {
    logDebug('fetch-live-gameweek', 'No updates to process');
    return;
  }

  const startTime = Date.now();
  logDebug('fetch-live-gameweek', `Processing ${updates.length} updates`);

  try {
    const batchSize = 50;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      logDebug('fetch-live-gameweek', `Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(updates.length/batchSize)}`);
      
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

    const duration = Date.now() - startTime;
    logDebug('fetch-live-gameweek', `Successfully processed ${updates.length} updates in ${duration}ms`);
  } catch (error) {
    logError('fetch-live-gameweek', 'Error in upsertLivePerformance:', error);
    throw error;
  }
}