import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './auth.ts';
import { logDebug, logError } from '../shared/logging-service.ts';

Deno.serve(async (req) => {
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
        // Create execution log
        const { data: log, error: logError } = await supabaseClient
          .from('schedule_execution_logs')
          .insert({
            schedule_id: schedule.id,
            status: 'running',
            execution_context: {
              instance_id: instanceId,
              schedule_type: schedule.schedule_type,
              execution_attempt: 1,
              started_at: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (logError) throw logError;

        // Execute the function
        const { error: invokeError } = await supabaseClient.functions.invoke(
          schedule.function_name,
          {
            body: {
              scheduled: true,
              context: {
                schedule_id: schedule.id,
                execution_id: log.id,
                instance_id: instanceId
              }
            }
          }
        );

        if (invokeError) throw invokeError;

        // Update execution log with success
        await supabaseClient
          .from('schedule_execution_logs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            execution_duration_ms: Date.now() - startTime
          })
          .eq('id', log.id);

        // Calculate and update next execution time
        const nextRun = calculateNextExecution(schedule);
        await supabaseClient
          .from('schedules')
          .update({
            last_execution_at: new Date().toISOString(),
            next_execution_at: nextRun.toISOString()
          })
          .eq('id', schedule.id);

        processedSchedules.push({
          id: schedule.id,
          function: schedule.function_name,
          success: true
        });

      } catch (error) {
        logError('process-schedules', `Failed to process schedule ${schedule.id}:`, error);
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

function calculateNextExecution(schedule: any): Date {
  const now = new Date();
  
  if (schedule.schedule_type === 'time_based') {
    if (schedule.time_config?.type === 'interval') {
      const intervalMinutes = schedule.time_config.intervalMinutes || 1440;
      const next = new Date(now);
      next.setMinutes(next.getMinutes() + intervalMinutes);
      return next;
    }
    
    if (schedule.time_config?.type === 'daily') {
      const [hours, minutes] = (schedule.time_config.hour || '03:00').split(':').map(Number);
      const next = new Date(now);
      next.setHours(hours, minutes, 0, 0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      return next;
    }
  }
  
  // Default to 30 minutes for event-based or unknown types
  const next = new Date(now);
  next.setMinutes(next.getMinutes() + 30);
  return next;
}