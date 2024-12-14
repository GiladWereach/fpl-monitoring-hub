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
    console.log('Starting game settings data fetch...')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/')
    if (!response.ok) {
      throw new Error(`FPL API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Game settings data fetched successfully')

    // Extract only the fields that exist in our database
    const mappedSettings = {
      id: 1,
      league_join_private_max: data.game_settings.league_join_private_max,
      league_join_public_max: data.game_settings.league_join_public_max,
      league_max_size_public_classic: data.game_settings.league_max_size_public_classic,
      league_max_size_public_h2h: data.game_settings.league_max_size_public_h2h,
      league_max_size_private_h2h: data.game_settings.league_max_size_private_h2h,
      squad_squadplay: data.game_settings.squad_squadplay,
      squad_squadsize: data.game_settings.squad_squadsize,
      squad_team_limit: data.game_settings.squad_team_limit,
      squad_total_spend: data.game_settings.squad_total_spend,
      transfers_cap: data.game_settings.transfers_cap,
      transfers_sell_on_fee: data.game_settings.transfers_sell_on_fee,
      last_updated: new Date().toISOString()
    }

    const { error: settingsError } = await supabaseClient
      .from('game_settings')
      .upsert([mappedSettings])

    if (settingsError) throw settingsError

    console.log('Game settings data processed successfully')

    return new Response(
      JSON.stringify({ success: true, message: 'Game settings data ingestion completed successfully' }),
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