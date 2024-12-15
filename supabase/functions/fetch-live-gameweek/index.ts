import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchLiveGameweekData } from './api-client.ts';
import { 
  getSupabaseClient, 
  getCurrentEvent,
  getActiveFixtures,
  getLastUpdate,
  upsertLivePerformance,
  triggerPointsCalculation
} from './database.ts';
import { mapPlayerDataToUpdate, shouldSkipUpdate } from './utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting live gameweek data fetch...');
    
    const supabaseClient = await getSupabaseClient();
    const currentEvent = await getCurrentEvent(supabaseClient);
    console.log(`Current gameweek: ${currentEvent.id}`);

    const activeFixtures = await getActiveFixtures(supabaseClient, currentEvent.id);

    if (!activeFixtures.length) {
      console.log('No active matches found, checking last update time...');
      const lastUpdate = await getLastUpdate(supabaseClient, currentEvent.id);

      if (shouldSkipUpdate(lastUpdate)) {
        console.log('Last update was less than 30 minutes ago, skipping update');
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Skipped update - no active matches and last update was recent',
            gameweek: currentEvent.id
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
    }

    const data = await fetchLiveGameweekData(currentEvent.id);
    const updates = data.elements.map(element => mapPlayerDataToUpdate(element, currentEvent.id));
    
    await upsertLivePerformance(supabaseClient, updates);
    await triggerPointsCalculation(supabaseClient);

    console.log('Live gameweek data processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Live gameweek data updated successfully',
        gameweek: currentEvent.id,
        updatedPlayers: updates.length,
        hasActiveMatches: activeFixtures.length > 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});