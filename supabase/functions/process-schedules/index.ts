import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { logDebug, logError } from "../_shared/logging-service.ts";
import { transitionState, getCurrentState } from "./services/state-management-service.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logDebug('process-schedules', 'Starting schedule processing...');
    const startTime = Date.now();
    const instanceId = crypto.randomUUID();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active schedules that are due for execution
    const { data: activeSchedules, error: schedulesError } = await supabaseClient
      .from('schedules')
      .select('*')
      .eq('enabled', true)
      .or('next_execution_at.is.null,next_execution_at.lte.now()');

    if (schedulesError) {
      logError('process-schedules', 'Error fetching schedules:', schedulesError);
      throw schedulesError;
    }

    logDebug('process-schedules', `Found ${activeSchedules?.length || 0} schedules to process`);
    const processedSchedules = [];

    for (const schedule of (activeSchedules || [])) {
      try {
        const currentState = await getCurrentState(supabaseClient, schedule.id);
        
        // Only process schedules in valid states
        if (!['idle', 'scheduled'].includes(currentState)) {
          logDebug('process-schedules', `Skipping schedule ${schedule.id} in state ${currentState}`);
          continue;
        }

        // Transition to pending
        await transitionState(supabaseClient, {
          schedule_id: schedule.id,
          from_state: currentState,
          to_state: 'pending',
          metadata: {
            instance_id: instanceId,
            started_at: new Date().toISOString()
          }
        });

        // Execute the function
        const { error: invokeError } = await supabaseClient.functions.invoke(
          schedule.function_name,
          {
            body: {
              scheduled: true,
              context: {
                schedule_id: schedule.id,
                instance_id: instanceId
              }
            }
          }
        );

        if (invokeError) throw invokeError;

        // Transition to completed
        await transitionState(supabaseClient, {
          schedule_id: schedule.id,
          from_state: 'pending',
          to_state: 'completed',
          metadata: {
            execution_duration_ms: Date.now() - startTime
          }
        });

        processedSchedules.push({
          id: schedule.id,
          function: schedule.function_name,
          success: true
        });

      } catch (error) {
        logError('process-schedules', `Failed to process schedule ${schedule.id}:`, error);
        
        await transitionState(supabaseClient, {
          schedule_id: schedule.id,
          from_state: 'pending',
          to_state: 'failed',
          metadata: {
            error: error.message,
            error_time: new Date().toISOString()
          }
        });

        processedSchedules.push({
          id: schedule.id,
          function: schedule.function_name,
          success: false,
          error: error.message
        });
      }
    }

    const processingTime = Date.now() - startTime;
    logDebug('process-schedules', `Schedule processing completed in ${processingTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedSchedules.length,
        schedules: processedSchedules,
        processingTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logError('process-schedules', 'Error in schedule processing:', error);
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