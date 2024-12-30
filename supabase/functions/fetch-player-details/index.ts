import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { fetchPlayerDetails } from './api-client.ts';
import { processPlayerData } from './data-processor.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting player details fetch...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get recently finished fixtures
    const { data: finishedFixtures, error: fixturesError } = await supabaseClient
      .from('fixtures')
      .select('id, team_h, team_a')
      .eq('finished', true)
      .eq('processed_for_player_details', false)
      .order('kickoff_time', { ascending: true })
      .limit(2);

    if (fixturesError) {
      console.error('Error fetching fixtures:', fixturesError);
      throw fixturesError;
    }
    
    if (!finishedFixtures?.length) {
      console.log('No new finished fixtures to process');
      return new Response(
        JSON.stringify({ success: true, message: 'No new fixtures to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${finishedFixtures.length} fixtures to process`);

    // Get players from the teams involved
    const teamIds = finishedFixtures.flatMap(f => [f.team_h, f.team_a]);
    const { data: players, error: playersError } = await supabaseClient
      .from('players')
      .select('id')
      .in('team', teamIds);

    if (playersError) {
      console.error('Error fetching players:', playersError);
      throw playersError;
    }

    console.log(`Found ${players?.length} players to update`);

    // Process each player
    for (const player of players || []) {
      try {
        const playerData = await fetchPlayerDetails(player.id);
        await processPlayerData(supabaseClient, player.id, playerData);
        await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
      } catch (error) {
        console.error(`Error processing player ${player.id}:`, error);
        continue;
      }
    }

    // Mark fixtures as processed
    const { error: updateFixturesError } = await supabaseClient
      .from('fixtures')
      .update({ processed_for_player_details: true })
      .in('id', finishedFixtures.map(f => f.id));

    if (updateFixturesError) {
      console.error('Error updating fixtures:', updateFixturesError);
      throw updateFixturesError;
    }

    console.log('Player details processing completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully processed ${players?.length} players from ${finishedFixtures.length} fixtures` 
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