import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { processSchedules } from './scheduler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting schedule processing...');
    const startTime = Date.now();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Log scheduler invocation with context
    const { error: metricError } = await supabaseClient
      .from('api_health_metrics')
      .upsert({
        endpoint: 'process-schedules',
        success_count: 1,
        avg_response_time: 0,
        last_success_time: new Date().toISOString(),
        execution_context: JSON.stringify({
          invocation_time: new Date().toISOString(),
          request_headers: Object.fromEntries(req.headers.entries())
        })
      });

    if (metricError) {
      console.error('Error logging metrics:', metricError);
    }

    const processedSchedules = await processSchedules(supabaseClient);
    const processingTime = Date.now() - startTime;

    // Update metrics with actual processing time and results
    const { error: updateError } = await supabaseClient
      .from('api_health_metrics')
      .update({ 
        avg_response_time: processingTime,
        last_success_time: new Date().toISOString(),
        execution_metrics: JSON.stringify({
          processing_time_ms: processingTime,
          schedules_processed: processedSchedules.length,
          timestamp: new Date().toISOString()
        })
      })
      .eq('endpoint', 'process-schedules');

    if (updateError) {
      console.error('Error updating metrics:', updateError);
    }

    console.log(`Schedule processing completed in ${processingTime}ms`);
    console.log(`Processed ${processedSchedules.length} schedules`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedSchedules.length,
        schedules: processedSchedules,
        processingTime,
        metrics: {
          total_time_ms: processingTime,
          schedules_count: processedSchedules.length,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in schedule processing:', error);
    
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Log comprehensive error information
      await supabaseClient
        .from('api_error_logs')
        .insert({
          endpoint: 'process-schedules',
          error_type: 'SERVER_ERROR',
          error_details: error.message,
          response_code: 500,
          error_context: JSON.stringify({
            error_message: error.message,
            error_stack: error.stack,
            timestamp: new Date().toISOString(),
            request_context: {
              method: req.method,
              headers: Object.fromEntries(req.headers.entries())
            }
          })
        });

      // Update health metrics with error information
      await supabaseClient
        .from('api_health_metrics')
        .upsert({
          endpoint: 'process-schedules',
          error_count: 1,
          last_error_time: new Date().toISOString(),
          error_context: JSON.stringify({
            last_error: error.message,
            error_stack: error.stack,
            timestamp: new Date().toISOString()
          })
        });

    } catch (logError) {
      console.error('Error logging failure:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});