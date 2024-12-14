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
    console.log('Starting element types data fetch...')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Add browser-like headers to avoid being blocked
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://fantasy.premierleague.com/',
    }

    console.log('Fetching data from FPL API...')
    const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      headers: headers
    })

    if (!response.ok) {
      console.error(`FPL API error: ${response.status}`)
      console.error('Response headers:', Object.fromEntries(response.headers.entries()))
      const responseText = await response.text()
      console.error('Response body:', responseText)
      throw new Error(`FPL API error: ${response.status} - ${responseText}`)
    }

    const data = await response.json()
    console.log('Element types data fetched successfully')

    // Transform the data before inserting
    const transformedElementTypes = data.element_types.map(type => ({
      id: type.id,
      plural_name: type.plural_name,
      plural_name_short: type.plural_name_short,
      singular_name: type.singular_name,
      singular_name_short: type.singular_name_short,
      squad_select: type.squad_select,
      squad_min_play: type.squad_min_play,
      squad_max_play: type.squad_max_play,
      element_count: type.element_count,
      squad_max_select: type.squad_max_select,
      squad_min_select: type.squad_min_select,
      sub_positions_locked: type.sub_positions_locked === true,
      ui_shirt_specific: type.ui_shirt_specific === true,
      last_updated: new Date().toISOString()
    }))

    console.log('Transformed element types:', transformedElementTypes)

    const { error: elementTypesError } = await supabaseClient
      .from('element_types')
      .upsert(transformedElementTypes)

    if (elementTypesError) {
      console.error('Supabase error:', elementTypesError)
      throw elementTypesError
    }

    console.log('Element types data processed successfully')

    return new Response(
      JSON.stringify({ success: true, message: 'Element types data ingestion completed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})