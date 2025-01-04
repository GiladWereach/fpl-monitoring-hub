import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting schedule processing...');

    // Get all active schedules that are due for execution
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .eq('enabled', true)
      .or('next_execution_at.is.null,next_execution_at.lte.now()');

    if (schedulesError) {
      throw schedulesError;
    }

    console.log(`Found ${schedules?.length || 0} schedules to process`);

    for (const schedule of (schedules || [])) {
      try {
        console.log(`Processing schedule for ${schedule.function_name}`);
        
        // Execute the function
        const { error: invokeError } = await supabase.functions.invoke(schedule.function_name, {
          body: { scheduled: true }
        });

        if (invokeError) {
          throw invokeError;
        }

        // Calculate next execution time based on schedule type and config
        const nextExecutionTime = new Date();
        if (schedule.time_config?.type === 'match_dependent') {
          nextExecutionTime.setMinutes(nextExecutionTime.getMinutes() + 
            (schedule.time_config.matchDayIntervalMinutes || 30));
        } else {
          nextExecutionTime.setMinutes(nextExecutionTime.getMinutes() + 30); // Default interval
        }

        // Update schedule with execution results
        await supabase
          .from('schedules')
          .update({
            last_execution_at: new Date().toISOString(),
            next_execution_at: nextExecutionTime.toISOString()
          })
          .eq('id', schedule.id);

        console.log(`Successfully processed ${schedule.function_name}`);

      } catch (error) {
        console.error(`Error processing schedule ${schedule.function_name}:`, error);
        
        // Log execution error
        await supabase
          .from('schedule_execution_logs')
          .insert({
            schedule_id: schedule.id,
            status: 'failed',
            error_details: error.message
          });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in process-schedules:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});