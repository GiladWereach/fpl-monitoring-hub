import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../shared/logging-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const fplHeaders = {
  'User-Agent': 'Mozilla/5.0',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const functionName = 'fetch-teams';
  const startTime = Date.now();

  try {
    logDebug(functionName, 'Starting teams data fetch...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch teams data from FPL API
    const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      headers: fplHeaders
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logError(functionName, 'FPL API error:', {
        status: response.status,
        body: errorBody
      });
      throw new Error(`FPL API error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    
    if (!data?.teams) {
      throw new Error('Invalid response format from FPL API');
    }

    logDebug(functionName, `Processing ${data.teams.length} teams`);

    // Upsert teams data
    const { error: upsertError } = await supabase
      .from('teams')
      .upsert(
        data.teams.map((team: any) => ({
          ...team,
          last_updated: new Date().toISOString()
        })),
        { onConflict: 'id' }
      );

    if (upsertError) {
      logError(functionName, 'Error upserting teams:', upsertError);
      throw upsertError;
    }

    // Log success metrics
    const executionTime = Date.now() - startTime;
    await supabase
      .from('api_health_metrics')
      .insert({
        endpoint: functionName,
        success_count: 1,
        error_count: 0,
        avg_response_time: executionTime,
        last_success_time: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Teams data updated successfully',
        count: data.teams.length,
        executionTime,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logError(functionName, 'Error in fetch-teams:', error);
    
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabase
        .from('api_health_metrics')
        .insert({
          endpoint: functionName,
          success_count: 0,
          error_count: 1,
          avg_response_time: executionTime,
          last_error_time: new Date().toISOString(),
          error_pattern: { error: error.message }
        });
    } catch (metricsError) {
      logError(functionName, 'Error logging metrics:', metricsError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});