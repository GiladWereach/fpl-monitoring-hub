import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Schedule } from './types.ts';
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

    // Log scheduler invocation
    await supabaseClient
      .from('api_health_metrics')
      .insert({
        endpoint: 'process-schedules',
        success_count: 1,
        avg_response_time: 0,
        last_success_time: new Date().toISOString()
      });

    const processedSchedules = await processSchedules(supabaseClient);
    const processingTime = Date.now() - startTime;

    // Update metrics with actual processing time
    await supabaseClient
      .from('api_health_metrics')
      .update({ avg_response_time: processingTime })
      .eq('endpoint', 'process-schedules')
      .gt('created_at', new Date(Date.now() - 1000).toISOString());

    console.log(`Schedule processing completed in ${processingTime}ms`);
    console.log(`Processed ${processedSchedules.length} schedules`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedSchedules.length,
        schedules: processedSchedules,
        processingTime
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
    
    // Log error in api_error_logs
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabaseClient
        .from('api_error_logs')
        .insert({
          endpoint: 'process-schedules',
          error_type: 'SERVER_ERROR',
          error_details: error.message,
          response_code: 500
        });

      await supabaseClient
        .from('api_health_metrics')
        .insert({
          endpoint: 'process-schedules',
          error_count: 1,
          last_error_time: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging failure:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});