import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { LivePerformanceUpdate } from './types.ts';

export async function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

export async function getCurrentEvent(supabaseClient: any) {
  const { data: currentEvent, error: eventError } = await supabaseClient
    .from('events')
    .select('id, deadline_time')
    .lt('deadline_time', new Date().toISOString())
    .gt('deadline_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('deadline_time', { ascending: false })
    .limit(1)
    .single();

  if (eventError) throw eventError;
  if (!currentEvent) throw new Error('No current gameweek found');

  return currentEvent;
}

export async function getActiveFixtures(supabaseClient: any, eventId: number) {
  const { data: activeFixtures, error: fixturesError } = await supabaseClient
    .from('fixtures')
    .select('*')
    .eq('event', eventId)
    .eq('started', true)
    .eq('finished', false);

  if (fixturesError) throw fixturesError;
  return activeFixtures || [];
}

export async function getLastUpdate(supabaseClient: any, eventId: number) {
  const { data: lastUpdate } = await supabaseClient
    .from('gameweek_live_performance')
    .select('last_updated')
    .eq('event_id', eventId)
    .order('last_updated', { ascending: false })
    .limit(1)
    .single();

  return lastUpdate;
}

export async function upsertLivePerformance(
  supabaseClient: any,
  updates: LivePerformanceUpdate[]
) {
  const batchSize = 50;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(updates.length/batchSize)}`);
    
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

export async function triggerPointsCalculation(supabaseClient: any) {
  console.log('Triggering points calculation...');
  const { error: calcError } = await supabaseClient.functions.invoke('calculate-points');
  
  if (calcError) {
    console.error('Error triggering points calculation:', calcError);
  }
}