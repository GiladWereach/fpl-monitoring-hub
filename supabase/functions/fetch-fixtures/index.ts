import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Handle schedule inquiry
    if (body.getSchedule) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Check for active matches
      const { data: activeMatches } = await supabaseClient
        .from('fixtures')
        .select('*')
        .eq('started', true)
        .eq('finished', false);

      const intervalMinutes = activeMatches?.length ? 2 : 30;
      
      return new Response(
        JSON.stringify({ intervalMinutes, reason: activeMatches?.length ? 'Active matches' : 'No active matches' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting fixtures data fetch...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Enhanced browser-like headers
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Origin': 'https://fantasy.premierleague.com',
      'Referer': 'https://fantasy.premierleague.com/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Connection': 'keep-alive'
    };

    console.log('Fetching data from FPL API...');
    const response = await fetch('https://fantasy.premierleague.com/api/fixtures/', {
      headers: headers
    });
    
    if (!response.ok) {
      console.error(`FPL API error: ${response.status}`, await response.text());
      throw new Error(`FPL API error: ${response.status}`);
    }

    const fixtures = await response.json();
    console.log(`Fetched ${fixtures.length} fixtures`);

    const { error: fixturesError } = await supabaseClient
      .from('fixtures')
      .upsert(fixtures.map(fixture => ({
        ...fixture,
        last_updated: new Date().toISOString()
      })));

    if (fixturesError) {
      console.error('Error upserting fixtures:', fixturesError);
      throw fixturesError;
    }

    console.log('Fixtures data processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully processed ${fixtures.length} fixtures` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});