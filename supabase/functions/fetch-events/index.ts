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
    console.log('Starting events data fetch...')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/')
    if (!response.ok) {
      throw new Error(`FPL API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Events data fetched successfully')

    // Transform the data to match our schema exactly
    const transformedEvents = data.events.map(event => ({
      id: event.id,
      name: event.name,
      deadline_time: event.deadline_time,
      average_entry_score: event.average_entry_score,
      finished: event.finished,
      data_checked: event.data_checked,
      highest_score: event.highest_score,
      is_previous: event.is_previous,
      is_current: event.is_current,
      is_next: event.is_next,
      chip_plays: event.chip_plays,
      most_selected: event.most_selected,
      most_transferred_in: event.most_transferred_in,
      top_element: event.top_element,
      transfers_made: event.transfers_made,
      most_captained: event.most_captained,
      most_vice_captained: event.most_vice_captained,
      last_updated: new Date().toISOString()
    }))

    console.log('Transformed events data:', transformedEvents)

    const { error: eventsError } = await supabaseClient
      .from('events')
      .upsert(transformedEvents)

    if (eventsError) {
      console.error('Supabase error:', eventsError)
      throw eventsError
    }

    console.log('Events data processed successfully')

    return new Response(
      JSON.stringify({ success: true, message: 'Events data ingestion completed successfully' }),
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