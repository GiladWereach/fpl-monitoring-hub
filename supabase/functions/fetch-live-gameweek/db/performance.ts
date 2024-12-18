import { getSupabaseClient } from './client.ts';
import { LivePerformanceUpdate } from '../types.ts';

export async function getLastUpdate(supabaseClient: any, eventId: number) {
  console.log(`Fetching last update for event ${eventId}`);
  const { data: lastUpdate, error } = await supabaseClient
    .from('gameweek_live_performance')
    .select('last_updated')
    .eq('event_id', eventId)
    .order('last_updated', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching last update:', error);
    throw error;
  }

  console.log('Last update:', lastUpdate);
  return lastUpdate;
}

export async function validatePlayers(supabaseClient: any, playerIds: number[]) {
  console.log(`Validating ${playerIds.length} players...`);
  
  const { data: existingPlayers, error } = await supabaseClient
    .from('players')
    .select('id')
    .in('id', playerIds);

  if (error) {
    console.error('Error validating players:', error);
    throw error;
  }

  const validPlayerIds = new Set(existingPlayers.map(p => p.id));
  console.log(`Found ${validPlayerIds.size} valid players out of ${playerIds.length}`);
  
  return validPlayerIds;
}

export async function upsertLivePerformance(
  supabaseClient: any,
  updates: LivePerformanceUpdate[]
) {
  if (!updates.length) {
    console.log('No updates to process');
    return;
  }

  const playerIds = [...new Set(updates.map(u => u.player_id))];
  const validPlayerIds = await validatePlayers(supabaseClient, playerIds);
  const validUpdates = updates.filter(update => validPlayerIds.has(update.player_id));

  console.log(`Processing ${validUpdates.length} valid updates out of ${updates.length} total`);

  if (!validUpdates.length) {
    console.log('No valid updates to process after filtering');
    return;
  }

  const batchSize = 50;
  for (let i = 0; i < validUpdates.length; i += batchSize) {
    const batch = validUpdates.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(validUpdates.length/batchSize)}`);
    
    const { error: upsertError } = await supabaseClient
      .from('gameweek_live_performance')
      .upsert(batch, {
        onConflict: 'event_id,player_id',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error(`Error upserting batch ${Math.floor(i/batchSize) + 1}:`, upsertError);
      throw upsertError;
    }
  }
}