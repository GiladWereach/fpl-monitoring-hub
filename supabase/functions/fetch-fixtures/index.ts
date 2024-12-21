import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { determineScheduleWindow } from '../shared/scheduling-service.ts';
import { logExecution } from '../shared/monitoring-service.ts';
import { logDebug, logError, logInfo } from '../shared/logging-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

async function fetchWithRetry(url: string, headers: Record<string, string>, retryCount = 0): Promise<Response> {
  try {
    const response = await fetch(url, { headers });
    
    if (response.ok) {
      return response;
    }

    if (response.status === 403 && retryCount < MAX_RETRIES) {
      const backoffTime = INITIAL_BACKOFF * Math.pow(2, retryCount);
      logInfo('fetch-fixtures', `Received 403, retrying in ${backoffTime}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      return fetchWithRetry(url, headers, retryCount + 1);
    }

    throw new Error(`FPL API error: ${response.status}`);
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const backoffTime = INITIAL_BACKOFF * Math.pow(2, retryCount);
      logInfo('fetch-fixtures', `Request failed, retrying in ${backoffTime}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      return fetchWithRetry(url, headers, retryCount + 1);
    }
    throw error;
  }
}

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
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    };

    logDebug(functionName, 'Fetching data from FPL API with enhanced headers...');
    const response = await fetchWithRetry('https://fantasy.premierleague.com/api/fixtures/', headers);
    const fixtures = await response.json();
    
    logInfo(functionName, `Fetched ${fixtures.length} fixtures successfully`);

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