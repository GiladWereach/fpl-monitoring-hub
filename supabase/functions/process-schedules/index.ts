import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './auth.ts';
import { processSchedule } from './services/schedule-processor.ts';
import { cleanupOldData } from './services/transaction-service.ts';
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

    // Run cleanup first
    await cleanupOldData(supabaseClient);

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
        const success = await processSchedule(supabaseClient, schedule, instanceId);
        if (success) {
          processedSchedules.push({
            id: schedule.id,
            function: schedule.function_name,
            success: true
          });
        }
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