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

    const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/')
    if (!response.ok) {
      throw new Error(`FPL API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Players data fetched successfully')

    const { error: playersError } = await supabaseClient
      .from('players')
      .upsert(data.elements.map(player => ({
        id: player.id,
        assists: player.assists,
        bonus: player.bonus,
        bps: player.bps,
        clean_sheets: player.clean_sheets,
        clean_sheets_per_90: player.clean_sheets_per_90,
        creativity: player.creativity,
        element_type: player.element_type,
        event_points: player.event_points,
        first_name: player.first_name,
        form: player.form,
        goals_conceded: player.goals_conceded,
        goals_scored: player.goals_scored,
        ict_index: player.ict_index,
        influence: player.influence,
        minutes: player.minutes,
        now_cost: player.now_cost,
        own_goals: player.own_goals,
        penalties_missed: player.penalties_missed,
        penalties_saved: player.penalties_saved,
        photo: player.photo,
        points_per_game: player.points_per_game,
        red_cards: player.red_cards,
        saves: player.saves,
        saves_per_90: player.saves_per_90,
        second_name: player.second_name,
        selected_by_percent: player.selected_by_percent,
        special: player.special,
        status: player.status,
        team_id: player.team,
        threat: player.threat,
        total_points: player.total_points,
        transfers_in: player.transfers_in,
        transfers_out: player.transfers_out,
        web_name: player.web_name,
        yellow_cards: player.yellow_cards,
        last_updated: new Date().toISOString()
      })))
    if (playersError) throw playersError

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