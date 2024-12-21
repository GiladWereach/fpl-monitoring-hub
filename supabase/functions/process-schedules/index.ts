import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Get active schedules that need processing
    const { data: schedules, error: schedulesError } = await supabaseClient
      .from('function_schedules')
      .select(`
        *,
        schedule_groups (
          name,
          description
        )
      `)
      .eq('status', 'active')
      .lte('next_execution_at', new Date().toISOString());

    if (schedulesError) {
      throw schedulesError;
    }

    console.log(`Found ${schedules?.length || 0} schedules to process`);
    const processedSchedules = [];

    // Process each schedule
    for (const schedule of (schedules || [])) {
      try {
        console.log(`Processing schedule for ${schedule.function_name}`);
        
        // Execute the function
        const { error: invokeError } = await supabaseClient.functions.invoke(
          schedule.function_name,
          {
            body: { scheduled: true }
          }
        );

        if (invokeError) throw invokeError;

        // Determine next execution time based on function type
        let nextExecutionTime = new Date();
        if (schedule.function_name === 'fetch-live-gameweek' || schedule.function_name === 'fetch-fixtures') {
          // Invoke the function to get the next interval
          const { data: scheduleData } = await supabaseClient.functions.invoke(
            schedule.function_name,
            { body: { getSchedule: true } }
          );

          const intervalMinutes = scheduleData?.intervalMinutes || 30;
          nextExecutionTime.setMinutes(nextExecutionTime.getMinutes() + intervalMinutes);
          
          console.log(`Next execution for ${schedule.function_name} in ${intervalMinutes} minutes`);
        } else {
          // Use default interval for other functions
          nextExecutionTime.setMinutes(nextExecutionTime.getMinutes() + (schedule.base_interval_minutes || 30));
        }

        // Update schedule
        await supabaseClient
          .from('function_schedules')
          .update({
            last_execution_at: new Date().toISOString(),
            next_execution_at: nextExecutionTime.toISOString(),
            consecutive_failures: 0,
            last_error: null
          })
          .eq('id', schedule.id);

        processedSchedules.push({
          id: schedule.id,
          function: schedule.function_name,
          success: true,
          nextExecution: nextExecutionTime
        });

      } catch (error) {
        console.error(`Error processing ${schedule.function_name}:`, error);
        
        // Update error status
        await supabaseClient
          .from('function_schedules')
          .update({
            consecutive_failures: (schedule.consecutive_failures || 0) + 1,
            last_error: error.message
          })
          .eq('id', schedule.id);
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`Schedule processing completed in ${processingTime}ms`);

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
    console.error('Error in schedule processing:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});