import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FPLResponse {
  teams: any[];
  elements: any[]; // players
  events: any[];
  game_settings: any;
  element_types: any[];
  chips: any[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting FPL data fetch...')
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch data from FPL API
    const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/')
    if (!response.ok) {
      throw new Error(`FPL API error: ${response.status}`)
    }

    const data: FPLResponse = await response.json()
    console.log('FPL data fetched successfully')

    // Process teams
    console.log('Processing teams...')
    const { error: teamsError } = await supabaseClient
      .from('teams')
      .upsert(data.teams.map(team => ({
        ...team,
        last_updated: new Date().toISOString()
      })))
    if (teamsError) throw teamsError

    // Process events (gameweeks)
    console.log('Processing events...')
    const { error: eventsError } = await supabaseClient
      .from('events')
      .upsert(data.events.map(event => ({
        ...event,
        last_updated: new Date().toISOString()
      })))
    if (eventsError) throw eventsError

    // Process game settings
    console.log('Processing game settings...')
    const { error: settingsError } = await supabaseClient
      .from('game_settings')
      .upsert([{
        id: 1, // Single record
        ...data.game_settings,
        last_updated: new Date().toISOString()
      }])
    if (settingsError) throw settingsError

    // Process element types (positions)
    console.log('Processing element types...')
    const { error: elementTypesError } = await supabaseClient
      .from('element_types')
      .upsert(data.element_types.map(type => ({
        ...type,
        last_updated: new Date().toISOString()
      })))
    if (elementTypesError) throw elementTypesError

    // Process chips
    console.log('Processing chips...')
    const { error: chipsError } = await supabaseClient
      .from('chips')
      .upsert(data.chips.map((chip, index) => ({
        ...chip,
        id: index + 1, // Generate sequential IDs
        last_updated: new Date().toISOString()
      })))
    if (chipsError) throw chipsError

    // Process players (elements)
    console.log('Processing players...')
    const { error: playersError } = await supabaseClient
      .from('players')
      .upsert(data.elements.map(player => ({
        ...player,
        last_updated: new Date().toISOString()
      })))
    if (playersError) throw playersError

    console.log('All data processed successfully')

    return new Response(
      JSON.stringify({ success: true, message: 'Data ingestion completed successfully' }),
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