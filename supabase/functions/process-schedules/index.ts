import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { calculateNextExecutionTime } from './services/schedule-calculator.ts';
import { logDebug, logError } from '../shared/logging-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logDebug('process-schedules', 'Starting schedule processing...');
    const startTime = Date.now();
    const instanceId = crypto.randomUUID(); // Unique ID for this process instance
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active schedules that are due for execution
    const { data: activeSchedules, error: schedulesError } = await supabaseClient
      .from('schedules')
      .select(`
        *,
        schedule_groups (
          name,
          description
        )
      `)
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
        logDebug('process-schedules', `Attempting to acquire lock for ${schedule.function_name}`);
        
        // Try to acquire a lock for this schedule
        const { data: lockAcquired } = await supabaseClient
          .rpc('acquire_schedule_lock', {
            p_schedule_id: schedule.id,
            p_locked_by: instanceId,
            p_lock_duration_seconds: schedule.execution_config?.timeout_seconds || 300
          });

        if (!lockAcquired) {
          logDebug('process-schedules', `Schedule ${schedule.function_name} is already being processed`);
          continue;
        }

        logDebug('process-schedules', `Processing schedule for ${schedule.function_name}`);
        
        try {
          // Execute the function
          const functionStartTime = Date.now();
          const { error: invokeError } = await supabaseClient.functions.invoke(
            schedule.function_name,
            {
              body: {
                scheduled: true,
                interval: schedule.base_interval_minutes,
                context: {
                  schedule_type: schedule.frequency_type,
                  execution_config: schedule.execution_config
                }
              }
            }
          );
          
          if (invokeError) {
            logError('process-schedules', `Error executing ${schedule.function_name}:`, invokeError);
            throw invokeError;
          }

          const executionTime = Date.now() - functionStartTime;
          logDebug('process-schedules', `Successfully executed ${schedule.function_name} in ${executionTime}ms`);

          // Calculate and set next execution time
          const nextExecutionTime = await calculateNextExecutionTime(supabaseClient, schedule);
          
          // Update schedule with execution results
          const { error: updateError } = await supabaseClient
            .from('schedules')
            .update({
              last_execution_at: new Date().toISOString(),
              next_execution_at: nextExecutionTime.toISOString(),
              consecutive_failures: 0,
              last_error: null
            })
            .eq('id', schedule.id);

          if (updateError) {
            logError('process-schedules', `Error updating schedule ${schedule.id}:`, updateError);
            throw updateError;
          }

          // Log successful execution
          const { error: logError } = await supabaseClient
            .from('schedule_execution_logs')
            .insert({
              schedule_id: schedule.id,
              status: 'completed',
              started_at: new Date(functionStartTime).toISOString(),
              completed_at: new Date().toISOString(),
              execution_duration_ms: executionTime,
              execution_context: {
                schedule_type: schedule.frequency_type,
                interval: schedule.base_interval_minutes
              }
            });

          if (logError) {
            console.error(`Error logging execution for ${schedule.function_name}:`, logError);
          }

          processedSchedules.push({
            id: schedule.id,
            function: schedule.function_name,
            success: true,
            duration: executionTime,
            nextExecution: nextExecutionTime
          });

        } finally {
          // Always release the lock, even if processing failed
          await supabaseClient
            .rpc('release_schedule_lock', {
              p_schedule_id: schedule.id,
              p_locked_by: instanceId
            });
        }

      } catch (error) {
        logError('process-schedules', `Failed to process schedule ${schedule.id}:`, error);
        
        // Update failure count and error message
        await supabaseClient
          .from('schedules')
          .update({
            consecutive_failures: schedule.consecutive_failures + 1,
            last_error: error.message,
            status: schedule.consecutive_failures >= 5 ? 'error' : 'active'
          })
          .eq('id', schedule.id);

        // Log failed execution
        await supabaseClient
          .from('schedule_execution_logs')
          .insert({
            schedule_id: schedule.id,
            status: 'failed',
            started_at: new Date(startTime).toISOString(),
            completed_at: new Date().toISOString(),
            error_details: error.message,
            execution_context: {
              schedule_type: schedule.frequency_type,
              interval: schedule.base_interval_minutes
            }
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