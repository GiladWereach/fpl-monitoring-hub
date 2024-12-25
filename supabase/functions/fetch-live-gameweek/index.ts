import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchLiveGameweekData } from './api-client.ts';
import { getCurrentEvent } from './db/events.ts';
import { upsertLivePerformance } from './db/performance.ts';
import { mapPlayerDataToUpdate } from './utils.ts';
import { logDebug, logError } from './logging.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Global lock tracking
const LOCK_KEY = 'fetch-live-gameweek-lock';
const LOCK_DURATION = 60000; // 1 minute in milliseconds
let lastExecutionTime = 0;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const functionName = 'fetch-live-gameweek';
  const startTime = Date.now();

  try {
    // Parse request body to check if this is a manual trigger
    const { scheduled, manual_trigger } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // For manual triggers, force release any existing locks
    if (manual_trigger) {
      logDebug(functionName, 'Manual trigger detected - forcing lock release');
      
      // Delete any existing locks
      await supabaseClient
        .from('schedule_locks')
        .delete()
        .eq('schedule_id', LOCK_KEY);
      
      // Reset last execution time
      lastExecutionTime = 0;
      
      // Mark any running executions as terminated
      await supabaseClient
        .from('schedule_execution_logs')
        .update({
          status: 'terminated',
          completed_at: new Date().toISOString(),
          error_details: 'Terminated by manual trigger'
        })
        .eq('status', 'running');

      logDebug(functionName, 'Cleared existing locks and terminated running executions');
    } else {
      // For scheduled runs, check the lock as usual
      if (startTime - lastExecutionTime < LOCK_DURATION) {
        logDebug(functionName, `Skipping execution - previous execution still within lock period (${Math.floor((startTime - lastExecutionTime) / 1000)}s ago)`);
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Skipped execution - previous execution still in progress',
            shouldProcess: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    lastExecutionTime = startTime;
    logDebug(functionName, 'Starting live gameweek data fetch...');
    
    // Acquire database lock
    const { data: lockAcquired, error: lockError } = await supabaseClient
      .rpc('acquire_schedule_lock', {
        p_schedule_id: LOCK_KEY,
        p_locked_by: startTime.toString(),
        p_lock_duration_seconds: 60
      });

    if (lockError || !lockAcquired) {
      logDebug(functionName, 'Could not acquire lock, another execution is in progress');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Another execution is in progress',
          shouldProcess: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    const processingTime = Date.now() - startTime;
    logDebug(functionName, `Processing completed in ${processingTime}ms`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Live gameweek data updated successfully',
        gameweek: currentEvent.id,
        updatedPlayers: updates.length,
        processingTime,
        manualTrigger: manual_trigger || false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logError(functionName, 'Error in fetch-live-gameweek:', error);
    
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