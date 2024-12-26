import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchLiveGameweekData } from './api-client.ts';
import { getCurrentEvent } from './db/events.ts';
import { upsertLivePerformance } from './db/performance.ts';
import { mapPlayerDataToUpdate } from './utils.ts';
import { logDebug, logError } from './logging.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const functionName = 'fetch-live-gameweek';
  const startTime = Date.now();

  try {
    const { manual_trigger } = await req.json();
    logDebug(functionName, `Starting live gameweek data fetch... ${manual_trigger ? '(manual trigger)' : ''}`);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // If manual trigger, clean up any stale execution logs
    if (manual_trigger) {
      logDebug(functionName, 'Manual trigger detected - cleaning up stale execution logs');
      await supabaseClient
        .from('schedule_execution_logs')
        .update({
          status: 'terminated',
          completed_at: new Date().toISOString(),
          error_details: 'Terminated by manual trigger'
        })
        .eq('status', 'running');
    }

    const currentEvent = await getCurrentEvent(supabaseClient);
    
    if (!currentEvent) {
      logDebug(functionName, 'No current gameweek found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No current gameweek found',
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
    await upsertLivePerformance(supabaseClient, updates);

    // Log success metrics
    const executionTime = Date.now() - startTime;
    await supabaseClient
      .from('api_health_metrics')
      .insert({
        endpoint: functionName,
        success_count: 1,
        error_count: 0,
        avg_response_time: executionTime,
        last_success_time: new Date().toISOString()
      });

    // Trigger points calculation after successful live data update
    logDebug(functionName, 'Triggering points calculation...');
    const { error: calcError } = await supabaseClient.functions.invoke('calculate-points', {
      body: { 
        triggered_by: 'live-gameweek',
        event_id: currentEvent.id
      }
    });

    if (calcError) {
      logError(functionName, 'Error triggering points calculation:', calcError);
    } else {
      logDebug(functionName, 'Points calculation triggered successfully');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Live gameweek data updated successfully',
        gameweek: currentEvent.id,
        updatedPlayers: updates.length,
        executionTime,
        manualTrigger: manual_trigger || false,
        pointsCalculationTriggered: !calcError
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logError(functionName, 'Error in fetch-live-gameweek:', error);
    
    // Log error metrics
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabaseClient
      .from('api_health_metrics')
      .insert({
        endpoint: functionName,
        success_count: 0,
        error_count: 1,
        avg_response_time: executionTime,
        last_error_time: new Date().toISOString(),
        error_pattern: { error: error.message }
      });
    
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