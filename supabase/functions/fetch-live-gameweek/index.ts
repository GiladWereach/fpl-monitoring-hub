import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface LivePlayerData {
  id: number;
  stats: {
    minutes: number;
    total_points: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    goals_conceded: number;
    own_goals: number;
    penalties_saved: number;
    penalties_missed: number;
    yellow_cards: number;
    red_cards: number;
    saves: number;
    bonus: number;
    bps: number;
    influence: string;
    creativity: string;
    threat: string;
    ict_index: string;
    starts: number;
    expected_goals: string;
    expected_assists: string;
    expected_goal_involvements: string;
    expected_goals_conceded: string;
  };
  explain: any[];
  in_dreamteam: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting live gameweek data fetch...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First check if a schedule already exists
    const { data: existingSchedule, error: fetchError } = await supabaseClient
      .from('schedules')
      .select('id')
      .eq('function_name', 'fetch-live-gameweek')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error fetching existing schedule:', fetchError);
      throw fetchError;
    }

    // Create or update the schedule
    const scheduleData = {
      function_name: 'fetch-live-gameweek',
      schedule_type: 'time_based',
      enabled: true,
      time_config: {
        type: 'interval',
        intervalMinutes: 2
      },
      execution_config: {
        retry_count: 3,
        timeout_seconds: 30,
        retry_delay_seconds: 60,
        concurrent_execution: false
      }
    };

    const { error: scheduleError } = await supabaseClient
      .from('schedules')
      .upsert(
        existingSchedule 
          ? { ...scheduleData, id: existingSchedule.id }
          : scheduleData,
        { 
          onConflict: 'id'
        }
      );

    if (scheduleError) {
      console.error('Error creating/updating schedule:', scheduleError);
      throw scheduleError;
    }

    // Find current gameweek
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

    console.log(`Current gameweek: ${currentEvent.id}`);

    // Check if there are any active matches
    const { data: activeFixtures, error: fixturesError } = await supabaseClient
      .from('fixtures')
      .select('*')
      .eq('event', currentEvent.id)
      .eq('started', true)
      .eq('finished', false);

    if (fixturesError) throw fixturesError;

    // If no active matches, check if we should wait
    if (!activeFixtures || activeFixtures.length === 0) {
      console.log('No active matches found, checking last update time...');
      
      const { data: lastUpdate } = await supabaseClient
        .from('gameweek_live_performance')
        .select('last_updated')
        .eq('event_id', currentEvent.id)
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      // If last update was less than 30 minutes ago, skip update
      if (lastUpdate && lastUpdate.last_updated) {
        const lastUpdateTime = new Date(lastUpdate.last_updated);
        const timeSinceLastUpdate = Date.now() - lastUpdateTime.getTime();
        const thirtyMinutesInMs = 30 * 60 * 1000;

        if (timeSinceLastUpdate < thirtyMinutesInMs) {
          console.log('Last update was less than 30 minutes ago, skipping update');
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Skipped update - no active matches and last update was recent',
              gameweek: currentEvent.id
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        }
      }
    }

    // Check if all fixtures are finished
    const { data: allFixtures, error: allFixturesError } = await supabaseClient
      .from('fixtures')
      .select('finished')
      .eq('event', currentEvent.id);

    if (allFixturesError) throw allFixturesError;

    if (allFixtures && allFixtures.every(fixture => fixture.finished)) {
      console.log('All fixtures are finished for this gameweek');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'All fixtures are finished for this gameweek',
          gameweek: currentEvent.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Fetch live data from FPL API with proper headers
    const response = await fetch(`https://fantasy.premierleague.com/api/event/${currentEvent.id}/live/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://fantasy.premierleague.com/',
        'Origin': 'https://fantasy.premierleague.com',
        'Connection': 'keep-alive'
      }
    });

    if (!response.ok) {
      console.error(`FPL API error: ${response.status}`, await response.text());
      throw new Error(`FPL API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Fetched live data for ${data.elements.length} players`);

    // Process and upsert live data
    const updates = data.elements.map((element: LivePlayerData) => ({
      event_id: currentEvent.id,
      player_id: element.id,
      modified: true,
      in_dreamteam: element.in_dreamteam,
      minutes: element.stats.minutes,
      total_points: element.stats.total_points,
      goals_scored: element.stats.goals_scored,
      assists: element.stats.assists,
      clean_sheets: element.stats.clean_sheets,
      goals_conceded: element.stats.goals_conceded,
      own_goals: element.stats.own_goals,
      penalties_saved: element.stats.penalties_saved,
      penalties_missed: element.stats.penalties_missed,
      yellow_cards: element.stats.yellow_cards,
      red_cards: element.stats.red_cards,
      saves: element.stats.saves,
      bonus: element.stats.bonus,
      bps: element.stats.bps,
      influence: parseFloat(element.stats.influence),
      creativity: parseFloat(element.stats.creativity),
      threat: parseFloat(element.stats.threat),
      ict_index: parseFloat(element.stats.ict_index),
      starts: element.stats.starts,
      expected_goals: parseFloat(element.stats.expected_goals),
      expected_assists: parseFloat(element.stats.expected_assists),
      expected_goal_involvements: parseFloat(element.stats.expected_goal_involvements),
      expected_goals_conceded: parseFloat(element.stats.expected_goals_conceded),
      last_updated: new Date().toISOString()
    }));

    // Process and upsert live data
    const { error: upsertError } = await supabaseClient
      .from('gameweek_live_performance')
      .upsert(updates, {
        onConflict: 'event_id,player_id',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error('Error upserting data:', upsertError);
      throw upsertError;
    }

    // Trigger points calculation
    console.log('Triggering points calculation...');
    const { error: calcError } = await supabaseClient.functions.invoke('calculate-points');
    
    if (calcError) {
      console.error('Error triggering points calculation:', calcError);
      // Don't throw, just log - we don't want to fail the whole process
    }

    console.log('Live gameweek data processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Live gameweek data updated successfully',
        gameweek: currentEvent.id,
        updatedPlayers: updates.length,
        hasActiveMatches: activeFixtures && activeFixtures.length > 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});