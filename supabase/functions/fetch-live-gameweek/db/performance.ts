import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../logging.ts';

export async function getLastUpdate(supabaseClient: ReturnType<typeof createClient>, eventId: number) {
  logDebug('fetch-live-gameweek', `Fetching last update for event ${eventId}`);
  
  const { data: lastUpdate, error } = await supabaseClient
    .from('gameweek_live_performance')
    .select('last_updated')
    .eq('event_id', eventId)
    .order('last_updated', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error
    logError('fetch-live-gameweek', 'Error fetching last update:', error);
    throw error;
  }

  logDebug('fetch-live-gameweek', 'Last update:', lastUpdate);
  return lastUpdate;
}

export async function cleanupOldPerformanceData(supabaseClient: ReturnType<typeof createClient>, eventId: number) {
  // Keep only the last 3 gameweeks of performance data
  const oldEventId = eventId - 3;
  
  const { error } = await supabaseClient
    .from('gameweek_live_performance')
    .delete()
    .lt('event_id', oldEventId);

  if (error) {
    logError('fetch-live-gameweek', 'Error cleaning up old performance data:', error);
    throw error;
  }
  
  logDebug('fetch-live-gameweek', `Cleaned up performance data older than gameweek ${oldEventId}`);
}

export async function upsertPerformanceData(
  supabaseClient: ReturnType<typeof createClient>,
  eventId: number,
  performanceData: any[]
) {
  if (!performanceData.length) {
    logDebug('fetch-live-gameweek', 'No performance data to upsert');
    return;
  }

  const batchSize = 50;
  for (let i = 0; i < performanceData.length; i += batchSize) {
    const batch = performanceData.slice(i, i + batchSize);
    logDebug('fetch-live-gameweek', `Upserting performance batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(performanceData.length/batchSize)}`);
    
    const { error } = await supabaseClient
      .from('gameweek_live_performance')
      .upsert(
        batch.map(data => ({
          ...data,
          event_id: eventId,
          last_updated: new Date().toISOString()
        })),
        {
          onConflict: 'event_id,player_id',
          ignoreDuplicates: false
        }
      );

    if (error) {
      logError('fetch-live-gameweek', `Error upserting performance batch:`, error);
      throw error;
    }
  }

  logDebug('fetch-live-gameweek', `Successfully upserted ${performanceData.length} performance records`);
}

export async function getPerformanceStats(supabaseClient: ReturnType<typeof createClient>, eventId: number) {
  const { data, error } = await supabaseClient
    .from('gameweek_live_performance')
    .select('count(*), min(last_updated), max(last_updated)')
    .eq('event_id', eventId)
    .single();

  if (error) {
    logError('fetch-live-gameweek', 'Error fetching performance stats:', error);
    throw error;
  }

  return {
    recordCount: data?.count || 0,
    firstUpdate: data?.min || null,
    lastUpdate: data?.max || null
  };
}

export async function archivePerformanceData(supabaseClient: ReturnType<typeof createClient>, eventId: number) {
  const { error: archiveError } = await supabaseClient
    .from('gameweek_performance_archive')
    .insert(
      supabaseClient
        .from('gameweek_live_performance')
        .select('*')
        .eq('event_id', eventId)
    );

  if (archiveError) {
    logError('fetch-live-gameweek', 'Error archiving performance data:', archiveError);
    throw archiveError;
  }

  const { error: deleteError } = await supabaseClient
    .from('gameweek_live_performance')
    .delete()
    .eq('event_id', eventId);

  if (deleteError) {
    logError('fetch-live-gameweek', 'Error deleting archived performance data:', deleteError);
    throw deleteError;
  }

  logDebug('fetch-live-gameweek', `Successfully archived performance data for gameweek ${eventId}`);
}