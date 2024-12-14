import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PlayerDetails {
  fixtures: any[];
  history: any[];
  history_past: any[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting player details fetch...')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get recently finished fixtures
    const { data: finishedFixtures, error: fixturesError } = await supabaseClient
      .from('fixtures')
      .select('id, team_h, team_a')
      .eq('finished', true)
      .eq('processed_for_player_details', false)
      .order('kickoff_time', { ascending: true })
      .limit(2) // Process 2 matches at a time to avoid overwhelming the API

    if (fixturesError) throw fixturesError
    
    if (!finishedFixtures?.length) {
      console.log('No new finished fixtures to process')
      return new Response(
        JSON.stringify({ success: true, message: 'No new fixtures to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${finishedFixtures.length} fixtures to process`)

    // Get players from the teams involved
    const teamIds = finishedFixtures.flatMap(f => [f.team_h, f.team_a])
    const { data: players, error: playersError } = await supabaseClient
      .from('players')
      .select('id')
      .in('team', teamIds)

    if (playersError) throw playersError

    console.log(`Found ${players?.length} players to update`)

    // Process each player
    for (const player of players || []) {
      try {
        console.log(`Fetching details for player ${player.id}`)
        const response = await fetch(
          `https://fantasy.premierleague.com/api/element-summary/${player.id}/`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          }
        )

        if (!response.ok) {
          console.error(`Error fetching player ${player.id}: ${response.status}`)
          continue
        }

        const data: PlayerDetails = await response.json()

        // Update player_fixtures
        if (data.fixtures?.length) {
          const { error: fixturesUpsertError } = await supabaseClient
            .from('player_fixtures')
            .upsert(
              data.fixtures.map(f => ({
                player_id: player.id,
                fixture_id: f.id,
                event: f.event,
                is_home: f.is_home,
                difficulty: f.difficulty,
                last_updated: new Date().toISOString()
              }))
            )
          
          if (fixturesUpsertError) throw fixturesUpsertError
        }

        // Update player_history
        if (data.history?.length) {
          const { error: historyUpsertError } = await supabaseClient
            .from('player_history')
            .upsert(
              data.history.map(h => ({
                player_id: player.id,
                fixture_id: h.fixture,
                opponent_team: h.opponent_team,
                round: h.round,
                kickoff_time: h.kickoff_time,
                was_home: h.was_home,
                team_h_score: h.team_h_score,
                team_a_score: h.team_a_score,
                total_points: h.total_points,
                minutes: h.minutes,
                goals_scored: h.goals_scored,
                assists: h.assists,
                clean_sheets: h.clean_sheets,
                goals_conceded: h.goals_conceded,
                own_goals: h.own_goals,
                penalties_saved: h.penalties_saved,
                penalties_missed: h.penalties_missed,
                yellow_cards: h.yellow_cards,
                red_cards: h.red_cards,
                saves: h.saves,
                bonus: h.bonus,
                bps: h.bps,
                influence: h.influence,
                creativity: h.creativity,
                threat: h.threat,
                ict_index: h.ict_index,
                starts: h.starts,
                expected_goals: h.expected_goals,
                expected_assists: h.expected_assists,
                expected_goal_involvements: h.expected_goal_involvements,
                expected_goals_conceded: h.expected_goals_conceded,
                value: h.value,
                transfers_balance: h.transfers_balance,
                selected: h.selected,
                transfers_in: h.transfers_in,
                transfers_out: h.transfers_out,
                last_updated: new Date().toISOString()
              }))
            )
          
          if (historyUpsertError) throw historyUpsertError
        }

        // Update player_history_past
        if (data.history_past?.length) {
          const { error: historyPastUpsertError } = await supabaseClient
            .from('player_history_past')
            .upsert(
              data.history_past.map(h => ({
                player_id: player.id,
                season_name: h.season_name,
                element_code: h.element_code,
                start_cost: h.start_cost,
                end_cost: h.end_cost,
                total_points: h.total_points,
                minutes: h.minutes,
                goals_scored: h.goals_scored,
                assists: h.assists,
                clean_sheets: h.clean_sheets,
                goals_conceded: h.goals_conceded,
                own_goals: h.own_goals,
                penalties_saved: h.penalties_saved,
                penalties_missed: h.penalties_missed,
                yellow_cards: h.yellow_cards,
                red_cards: h.red_cards,
                saves: h.saves,
                bonus: h.bonus,
                bps: h.bps,
                influence: h.influence,
                creativity: h.creativity,
                threat: h.threat,
                ict_index: h.ict_index,
                starts: h.starts,
                expected_goals: h.expected_goals,
                expected_assists: h.expected_assists,
                expected_goal_involvements: h.expected_goal_involvements,
                expected_goals_conceded: h.expected_goals_conceded,
                last_updated: new Date().toISOString()
              }))
            )
          
          if (historyPastUpsertError) throw historyPastUpsertError
        }

        // Add delay to respect rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Error processing player ${player.id}:`, error)
        // Continue with next player
        continue
      }
    }

    // Mark fixtures as processed
    const { error: updateFixturesError } = await supabaseClient
      .from('fixtures')
      .update({ processed_for_player_details: true })
      .in('id', finishedFixtures.map(f => f.id))

    if (updateFixturesError) throw updateFixturesError

    console.log('Player details processing completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully processed ${players?.length} players from ${finishedFixtures.length} fixtures` 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})