import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting players data fetch...')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`FPL API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Players data fetched successfully')

    const transformedPlayers = data.elements.map(player => ({
      id: player.id,
      code: player.code,
      element_type: player.element_type,
      first_name: player.first_name,
      second_name: player.second_name,
      web_name: player.web_name,
      team_id: player.team,
      can_transact: player.status !== 'u',
      can_select: player.status === 'a',
      cost_change_event: player.cost_change_event,
      cost_change_event_fall: player.cost_change_event_fall,
      cost_change_start: player.cost_change_start,
      cost_change_start_fall: player.cost_change_start_fall,
      chance_of_playing_next_round: player.chance_of_playing_next_round,
      chance_of_playing_this_round: player.chance_of_playing_this_round,
      dreamteam_count: player.dreamteam_count,
      in_dreamteam: player.in_dreamteam,
      news: player.news,
      news_added: player.news_added,
      status: player.status,
      now_cost: player.now_cost,
      selected_by_percent: parseFloat(player.selected_by_percent),
      special: player.special,
      squad_number: player.squad_number,
      transfers_in: player.transfers_in,
      transfers_in_event: player.transfers_in_event,
      transfers_out: player.transfers_out,
      transfers_out_event: player.transfers_out_event,
      form: parseFloat(player.form),
      points_per_game: parseFloat(player.points_per_game),
      ep_next: parseFloat(player.ep_next),
      ep_this: parseFloat(player.ep_this),
      event_points: player.event_points,
      total_points: player.total_points,
      value_form: parseFloat(player.value_form),
      value_season: parseFloat(player.value_season),
      minutes: player.minutes,
      goals_scored: player.goals_scored,
      assists: player.assists,
      clean_sheets: player.clean_sheets,
      goals_conceded: player.goals_conceded,
      own_goals: player.own_goals,
      penalties_saved: player.penalties_saved,
      penalties_missed: player.penalties_missed,
      yellow_cards: player.yellow_cards,
      red_cards: player.red_cards,
      saves: player.saves,
      bonus: player.bonus,
      bps: player.bps,
      influence: parseFloat(player.influence),
      creativity: parseFloat(player.creativity),
      threat: parseFloat(player.threat),
      ict_index: parseFloat(player.ict_index),
      starts: player.starts,
      expected_goals: parseFloat(player.expected_goals),
      expected_assists: parseFloat(player.expected_assists),
      expected_goal_involvements: parseFloat(player.expected_goal_involvements),
      expected_goals_conceded: parseFloat(player.expected_goals_conceded),
      expected_goals_per_90: parseFloat(player.expected_goals_per_90),
      expected_assists_per_90: parseFloat(player.expected_assists_per_90),
      expected_goal_involvements_per_90: parseFloat(player.expected_goal_involvements_per_90),
      expected_goals_conceded_per_90: parseFloat(player.expected_goals_conceded_per_90),
      goals_conceded_per_90: parseFloat(player.goals_conceded_per_90),
      starts_per_90: parseFloat(player.starts_per_90),
      clean_sheets_per_90: parseFloat(player.clean_sheets_per_90),
      influence_rank: player.influence_rank,
      influence_rank_type: player.influence_rank_type,
      creativity_rank: player.creativity_rank,
      creativity_rank_type: player.creativity_rank_type,
      threat_rank: player.threat_rank,
      threat_rank_type: player.threat_rank_type,
      ict_index_rank: player.ict_index_rank,
      ict_index_rank_type: player.ict_index_rank_type,
      now_cost_rank: player.now_cost_rank,
      now_cost_rank_type: player.now_cost_rank_type,
      form_rank: player.form_rank,
      form_rank_type: player.form_rank_type,
      points_per_game_rank: player.points_per_game_rank,
      points_per_game_rank_type: player.points_per_game_rank_type,
      selected_rank: player.selected_rank,
      selected_rank_type: player.selected_rank_type,
      corners_and_indirect_freekicks_order: player.corners_and_indirect_freekicks_order,
      corners_and_indirect_freekicks_text: player.corners_and_indirect_freekicks_text,
      direct_freekicks_order: player.direct_freekicks_order,
      direct_freekicks_text: player.direct_freekicks_text,
      penalties_order: player.penalties_order,
      penalties_text: player.penalties_text,
      photo: player.photo,
      removed: false,
      last_updated: new Date().toISOString(),
      region: player.region,
      saves_per_90: parseFloat(player.saves_per_90),
      team: player.team,
      team_code: player.team_code
    }))

    console.log('Transformed players data')

    const { error: playersError } = await supabaseClient
      .from('players')
      .upsert(transformedPlayers)

    if (playersError) {
      console.error('Error upserting players:', playersError)
      throw playersError
    }

    console.log('Players data processed successfully')

    return new Response(
      JSON.stringify({ success: true, message: 'Players data ingestion completed successfully' }),
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