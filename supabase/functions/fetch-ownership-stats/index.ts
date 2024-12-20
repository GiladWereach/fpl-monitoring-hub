import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Initializing Supabase client...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the current event
    console.log('Fetching current event...');
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('is_current', true)
      .single();

    if (eventError) {
      throw new Error(`Failed to fetch current event: ${eventError.message}`);
    }

    if (!eventData) {
      throw new Error('No current event found');
    }

    const currentEvent = eventData.id;

    // For now, return a simplified response
    console.log('Returning temporary ownership data');
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          event: currentEvent,
          ownership_data: []
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        }
      }
    );

  } catch (error) {
    console.error('Error in fetch-ownership-stats:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch ownership stats',
        details: error.message
      }),
      {
        headers: corsHeaders,
        status: 500
      }
    );
  }
});