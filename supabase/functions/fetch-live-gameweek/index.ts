import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchLiveGameweekData } from './api-client.ts';
import { determineScheduleWindow } from './services/matchSchedulingService.ts';
import { 
  getCurrentEvent,
  upsertLivePerformance,
  triggerPointsCalculation,
  shouldProcessGameweek
} from './database.ts';
import { mapPlayerDataToUpdate } from './utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Handle schedule inquiry
    if (body.getSchedule) {
      console.log('Getting collection schedule...');
      const schedule = await determineScheduleWindow();
      return new Response(
        JSON.stringify(schedule),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting live gameweek data fetch...');
    
    const supabaseClient = await getSupabaseClient();
    const currentEvent = await getCurrentEvent(supabaseClient);
    
    if (!currentEvent) {
      console.log('No current gameweek found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No current gameweek found',
          shouldProcess: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if we should process this gameweek
    const shouldProcess = await shouldProcessGameweek(supabaseClient, currentEvent.id);
    
    if (!shouldProcess) {
      console.log('Gameweek should not be processed at this time');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Gameweek should not be processed at this time',
          gameweek: currentEvent.id,
          shouldProcess: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await fetchLiveGameweekData(currentEvent.id);
    const updates = data.elements.map(element => mapPlayerDataToUpdate(element, currentEvent.id));
    
    await upsertLivePerformance(supabaseClient, updates);
    await triggerPointsCalculation(supabaseClient);

    // Get next collection schedule
    const schedule = await determineScheduleWindow();
    console.log('Next collection in', schedule.intervalMinutes, 'minutes -', schedule.reason);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Live gameweek data updated successfully',
        gameweek: currentEvent.id,
        updatedPlayers: updates.length,
        nextCollection: {
          intervalMinutes: schedule.intervalMinutes,
          reason: schedule.reason
        }
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