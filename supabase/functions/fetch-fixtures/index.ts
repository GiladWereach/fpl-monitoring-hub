import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchWithRetry } from './api-client.ts';
import { upsertFixtures } from './database.ts';
import { logDebug, logError, logInfo } from './logging.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BOOTSTRAP_URL = 'https://fantasy.premierleague.com/api/bootstrap-static/';
const FIXTURES_URL = 'https://fantasy.premierleague.com/api/fixtures/';

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

    logInfo(functionName, 'Starting fixtures data fetch...');
    
    // First fetch bootstrap to establish a session
    await fetchWithRetry(BOOTSTRAP_URL);
    
    // Add a small delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Then fetch fixtures
    const response = await fetchWithRetry(FIXTURES_URL);
    
    let fixtures;
    try {
      const text = await response.text();
      logDebug(functionName, `Raw response length: ${text.length}`);
      
      if (!text) {
        throw new Error('Empty response from FPL API');
      }
      
      fixtures = JSON.parse(text);
      
      if (!Array.isArray(fixtures)) {
        logError(functionName, `Invalid data format. Received: ${typeof fixtures}`);
        throw new Error('Invalid fixtures data format - expected array');
      }
    } catch (error) {
      logError(functionName, 'Failed to parse fixtures JSON:', error);
      throw new Error(`Failed to parse fixtures data: ${error.message}`);
    }
    
    logInfo(functionName, `Fetched ${fixtures.length} fixtures successfully`);

    await upsertFixtures(supabaseClient, fixtures);

    const executionTime = Date.now() - startTime;
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
