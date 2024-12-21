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
const TIMEOUT = 30000; // 30 seconds - increased timeout

async function fetchWithRetry(url: string, headers: Record<string, string>, retryCount = 0): Promise<Response> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    logDebug('fetch-fixtures', `Attempt ${retryCount + 1}/${MAX_RETRIES} to fetch data`);
    
    const response = await fetch(url, { 
      headers,
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    // Log response details for debugging
    logDebug('fetch-fixtures', `Response status: ${response.status}`);
    logDebug('fetch-fixtures', `Response headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      logDebug('fetch-fixtures', `Content-Type: ${contentType}`);
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        logError('fetch-fixtures', `Invalid content type. Response body: ${text}`);
        throw new Error('Invalid content type received from FPL API');
      }
      return response;
    }

    if (response.status === 403 && retryCount < MAX_RETRIES) {
      const backoffTime = INITIAL_BACKOFF * Math.pow(2, retryCount);
      logInfo('fetch-fixtures', `Received 403, retrying in ${backoffTime}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      return fetchWithRetry(url, headers, retryCount + 1);
    }

    const errorText = await response.text();
    logError('fetch-fixtures', `FPL API error response: ${errorText}`);
    throw new Error(`FPL API error: ${response.status}. Response: ${errorText}`);
  } catch (error) {
    if (error.name === 'AbortError') {
      logError('fetch-fixtures', 'Request timeout');
      throw new Error('Request timeout');
    }

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
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    };

    logDebug(functionName, 'Fetching data from FPL API with enhanced headers...');
    const response = await fetchWithRetry('https://fantasy.premierleague.com/api/fixtures/', headers);
    
    let fixtures;
    try {
      const text = await response.text();
      logDebug(functionName, `Raw response length: ${text.length}`);
      
      if (!text) {
        throw new Error('Empty response from FPL API');
      }
      
      try {
        fixtures = JSON.parse(text);
      } catch (parseError) {
        logError(functionName, `JSON parse error. Response text: ${text.substring(0, 200)}...`);
        throw new Error(`Failed to parse JSON: ${parseError.message}`);
      }
      
      if (!Array.isArray(fixtures)) {
        logError(functionName, `Invalid data format. Received: ${typeof fixtures}`);
        throw new Error('Invalid fixtures data format - expected array');
      }
    } catch (error) {
      logError(functionName, 'Failed to parse fixtures JSON:', error);
      throw new Error(`Failed to parse fixtures data: ${error.message}`);
    }
    
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