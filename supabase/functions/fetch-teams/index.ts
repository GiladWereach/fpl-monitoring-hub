import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getFplRequestInit } from "../_shared/fpl-headers.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logDebug, logError } from "../_shared/logging-service.ts"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    logDebug('fetch-teams', 'Starting teams fetch');
    const response = await fetch(
      'https://fantasy.premierleague.com/api/bootstrap-static/',
      getFplRequestInit()
    );

    if (!response.ok) {
      const error = `FPL API error: ${response.status}`;
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
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});