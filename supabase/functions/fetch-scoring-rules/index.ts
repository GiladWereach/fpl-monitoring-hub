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
    console.log('Starting scoring rules data fetch...')
    
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
    console.log('Scoring rules data fetched successfully')

    const { error: rulesError } = await supabaseClient
      .from('scoring_rules')
      .upsert([{
        id: 1,
        long_play: data.game_settings.minutes_limit,
        short_play: Math.floor(data.game_settings.minutes_limit / 2),
        goals_scored_gkp: 6,
        goals_scored_def: 6,
        goals_scored_mid: 5,
        goals_scored_fwd: 4,
        goals_conceded_gkp: -1,
        goals_conceded_def: -1,
        goals_conceded_mid: 0,
        goals_conceded_fwd: 0,
        assists: 3,
        clean_sheets_gkp: 4,
        clean_sheets_def: 4,
        clean_sheets_mid: 1,
        clean_sheets_fwd: 0,
        penalties_saved: 5,
        penalties_missed: -2,
        yellow_cards: -1,
        red_cards: -3,
        own_goals: -2,
        bonus: 1,
        saves: 1,
        last_updated: new Date().toISOString()
      }])

    if (rulesError) throw rulesError

    console.log('Scoring rules data processed successfully')

    return new Response(
      JSON.stringify({ success: true, message: 'Scoring rules data ingestion completed successfully' }),
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