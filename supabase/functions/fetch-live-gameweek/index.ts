import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchLiveGameweekData } from './api-client.ts';
import { determineScheduleWindow } from './services/matchSchedulingService.ts';
import { getCurrentEvent, shouldProcessGameweek } from './database.ts';
import { mapPlayerDataToUpdate } from './utils.ts';
import { updateAPIMetrics } from './db/metrics.ts';
import { logDebug, logError, logInfo } from './logging.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const functionName = 'fetch-live-gameweek';
  const startTime = Date.now();

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    logInfo(functionName, 'Starting live gameweek data fetch...');
    
    const body = await req.json();
    
    // Handle schedule inquiry
    if (body.getSchedule) {
      logInfo(functionName, 'Getting collection schedule...');
      const schedule = await determineScheduleWindow();
      return new Response(
        JSON.stringify(schedule),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentEvent = await getCurrentEvent(supabaseClient);
    
    if (!currentEvent) {
      logInfo(functionName, 'No current gameweek found');
      await updateAPIMetrics(supabaseClient, functionName, true, Date.now() - startTime);
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
      logInfo(functionName, 'Gameweek should not be processed at this time');
      await updateAPIMetrics(supabaseClient, functionName, true, Date.now() - startTime);
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
    if (!data?.elements) {
      throw new Error('Invalid response format from FPL API');
    }

    const updates = data.elements.map(element => mapPlayerDataToUpdate(element, currentEvent.id));
    
    // Update metrics before potentially throwing errors
    await updateAPIMetrics(supabaseClient, functionName, true, Date.now() - startTime);

    // Get next collection schedule
    const schedule = await determineScheduleWindow();
    logInfo(functionName, `Next collection in ${schedule.intervalMinutes} minutes - ${schedule.reason}`);

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
    logError(functionName, 'Error in fetch-live-gameweek:', error);
    await updateAPIMetrics(supabaseClient, functionName, false, Date.now() - startTime);
    
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