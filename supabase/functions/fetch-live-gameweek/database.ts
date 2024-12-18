import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { LivePerformanceUpdate } from './types.ts';

export async function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

export async function getCurrentEvent(supabaseClient: any) {
  console.log('Fetching current event...');
  const { data: currentEvent, error: eventError } = await supabaseClient
    .from('events')
    .select('id, deadline_time, finished')
    .lt('deadline_time', new Date().toISOString())
    .gt('deadline_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('deadline_time', { ascending: false })
    .limit(1)
    .single();

  if (eventError) {
    console.error('Error fetching current event:', eventError);
    throw eventError;
  }
  
  if (!currentEvent) {
    console.log('No current gameweek found within the last 7 days');
    throw new Error('No current gameweek found');
  }

  console.log('Current event:', currentEvent);
  return currentEvent;
}

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

export async function getLastUpdate(supabaseClient: any, eventId: number) {
  console.log(`Fetching last update for event ${eventId}`);
  const { data: lastUpdate, error } = await supabaseClient
    .from('gameweek_live_performance')
    .select('last_updated')
    .eq('event_id', eventId)
    .order('last_updated', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error
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

  // Validate players first
  const playerIds = [...new Set(updates.map(u => u.player_id))];
  const validPlayerIds = await validatePlayers(supabaseClient, playerIds);

  // Filter out updates for invalid player IDs
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

export async function triggerPointsCalculation(supabaseClient: any) {
  console.log('Triggering points calculation...');
  const { error: calcError } = await supabaseClient.functions.invoke('calculate-points');
  
  if (calcError) {
    console.error('Error triggering points calculation:', calcError);
  }
}

export async function shouldProcessGameweek(supabaseClient: any, eventId: number): Promise<boolean> {
  try {
    console.log(`Checking if gameweek ${eventId} should be processed...`);
    
    // Get the current event details
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select('deadline_time, finished')
      .eq('id', eventId)
      .single();

    if (eventError) {
      console.error('Error fetching event details:', eventError);
      throw eventError;
    }

    const now = new Date();
    const deadlineTime = new Date(event.deadline_time);
    
    // If the gameweek is finished, we don't need to process it
    if (event.finished) {
      console.log(`Gameweek ${eventId} is finished, no need to process`);
      return false;
    }

    // If we're before the deadline, don't process
    if (now < deadlineTime) {
      console.log(`Current time is before gameweek ${eventId} deadline, no need to process`);
      return false;
    }

    // Check if there are any active fixtures
    const { data: fixtures, error: fixturesError } = await supabaseClient
      .from('fixtures')
      .select('started, finished')
      .eq('event', eventId);

    if (fixturesError) {
      console.error('Error fetching fixtures:', fixturesError);
      throw fixturesError;
    }

    // If any fixture is started but not finished, we should process
    const hasActiveFixtures = fixtures.some(f => f.started && !f.finished);
    if (hasActiveFixtures) {
      console.log(`Gameweek ${eventId} has active fixtures, should process`);
      return true;
    }

    // If all fixtures are finished, check if we need one final update
    const allFixturesFinished = fixtures.every(f => f.finished);
    if (allFixturesFinished) {
      // Get the last update time
      const lastUpdate = await getLastUpdate(supabaseClient, eventId);
      
      // If we haven't updated in the last hour after all fixtures finished,
      // do one final update
      if (!lastUpdate?.last_updated || 
          (now.getTime() - new Date(lastUpdate.last_updated).getTime() > 60 * 60 * 1000)) {
        console.log(`Performing final update for gameweek ${eventId}`);
        return true;
      }
    }

    console.log(`No processing needed for gameweek ${eventId}`);
    return false;
  } catch (error) {
    console.error('Error checking if gameweek should be processed:', error);
    return false;
  }
}