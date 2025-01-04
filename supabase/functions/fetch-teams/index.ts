import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getFplRequestInit } from "../_shared/fpl-headers.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logDebug, logError } from "../_shared/logging-service.ts"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

async function fetchWithRetry(url: string, init: RequestInit, retryCount = 0): Promise<Response> {
  try {
    logDebug('fetch-teams', `Attempt ${retryCount + 1}: Fetching from ${url}`);
    const response = await fetch(url, init);
    
    if (!response.ok) {
      const responseText = await response.text();
      logError('fetch-teams', `HTTP Error: ${response.status} - ${responseText}`);
      
      if (response.status === 403 && retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        logDebug('fetch-teams', `Received 403, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, init, retryCount + 1);
      }
      
      throw new Error(`FPL API error: ${response.status} - ${responseText}`);
    }
    
    return response;
  } catch (error) {
    logError('fetch-teams', `Network error in fetchWithRetry:`, error);
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      logDebug('fetch-teams', `Network error, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, init, retryCount + 1);
    }
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    logDebug('fetch-teams', 'Starting teams fetch');
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch teams data from FPL API
    const response = await fetchWithRetry(
      'https://fantasy.premierleague.com/api/bootstrap-static/',
      getFplRequestInit()
    );

    const data = await response.json();
    
    if (!data || !Array.isArray(data.teams)) {
      const error = 'Invalid data structure received from FPL API';
      logError('fetch-teams', error, data);
      throw new Error(error);
    }

    logDebug('fetch-teams', `Successfully fetched ${data.teams.length} teams from FPL API`);
    
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
      logError('fetch-teams', 'Error upserting teams:', upsertError);
      throw upsertError;
    }

    logDebug('fetch-teams', `Successfully updated ${data.teams.length} teams in database`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: data.teams.length,
        message: `Successfully updated ${data.teams.length} teams`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    logError('fetch-teams', 'Error in fetch-teams:', error);
    
    // Return a more detailed error response
    return new Response(
      JSON.stringify({ 
        error: error.message,
        retryable: error.message.includes('403'),
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});