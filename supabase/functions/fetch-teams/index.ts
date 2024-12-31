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
    const response = await fetch(url, init);
    
    if (response.status === 403 && retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      logDebug('fetch-teams', `Received 403, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, init, retryCount + 1);
    }
    
    return response;
  } catch (error) {
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
    const response = await fetchWithRetry(
      'https://fantasy.premierleague.com/api/bootstrap-static/',
      getFplRequestInit()
    );

    if (!response.ok) {
      const error = `FPL API error: ${response.status} - ${await response.text()}`;
      logError('fetch-teams', error);
      throw new Error(error);
    }

    const data = await response.json();
    const teams = data.teams;

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Upsert teams data
    const { error: upsertError } = await supabase
      .from('teams')
      .upsert(
        teams.map((team: any) => ({
          ...team,
          last_updated: new Date().toISOString()
        })),
        { onConflict: 'id' }
      );

    if (upsertError) {
      logError('fetch-teams', 'Error upserting teams:', upsertError);
      throw upsertError;
    }

    logDebug('fetch-teams', `Successfully updated ${teams.length} teams`);

    return new Response(
      JSON.stringify({ success: true, count: teams.length }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    logError('fetch-teams', 'Error in fetch-teams:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        retryable: error.message.includes('403')
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});