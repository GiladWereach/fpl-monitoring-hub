import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { determineScheduleWindow } from '../shared/scheduling-service.ts';
import { logExecution } from '../shared/monitoring-service.ts';
import { logDebug, logError, logInfo } from '../shared/logging-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const functionName = 'fetch-fixtures';
  const startTime = Date.now();
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    
    // Handle schedule inquiry
    if (body.getSchedule) {
      logInfo(functionName, 'Getting collection schedule...');
      const schedule = await determineScheduleWindow(supabaseClient, functionName);
      return new Response(
        JSON.stringify(schedule),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logInfo(functionName, 'Starting fixtures data fetch...');
    
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

    logDebug(functionName, 'Fetching data from FPL API...');
    const response = await fetch('https://fantasy.premierleague.com/api/fixtures/', {
      headers: headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logError(functionName, `FPL API error: ${response.status}`, errorText);
      throw new Error(`FPL API error: ${response.status}`);
    }

    const fixtures = await response.json();
    logInfo(functionName, `Fetched ${fixtures.length} fixtures`);

    const { error: fixturesError } = await supabaseClient
      .from('fixtures')
      .upsert(fixtures.map(fixture => ({
        ...fixture,
        last_updated: new Date().toISOString()
      })));

    if (fixturesError) {
      logError(functionName, 'Error upserting fixtures:', fixturesError);
      throw fixturesError;
    }

    const executionTime = Date.now() - startTime;
    await logExecution(supabaseClient, functionName, {
      duration_ms: executionTime,
      success: true,
      collection_stats: {
        records_processed: fixtures.length,
        records_updated: fixtures.length
      }
    });

    logInfo(functionName, `Fixtures data processed successfully in ${executionTime}ms`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully processed ${fixtures.length} fixtures`,
        executionTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logError(functionName, 'Error:', error);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await logExecution(supabaseClient, functionName, {
      duration_ms: executionTime,
      success: false,
      error: error.message
    });

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        executionTime 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});