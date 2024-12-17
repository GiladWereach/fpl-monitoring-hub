import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface Schedule {
  id: string;
  function_name: string;
  schedule_type: 'time_based' | 'event_based';
  enabled: boolean;
  time_config: {
    type: 'interval' | 'daily' | 'weekly' | 'monthly' | 'cron';
    intervalMinutes?: number;
    cronExpression?: string;
    hour?: number;
  } | null;
  event_config: {
    triggerType: string;
    offsetMinutes: number;
  } | null;
  last_execution_at: string | null;
  next_execution_at: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing schedules...');
    
    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      throw new Error('Missing Authorization header');
    }

    // Extract and validate the token
    const token = authHeader.replace('Bearer ', '');
    if (token !== Deno.env.get('ANON_KEY')) {
      console.error('Invalid authorization token');
      throw new Error('Invalid authorization token');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching enabled time-based schedules...');
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .eq('enabled', true)
      .eq('schedule_type', 'time_based');

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
      throw schedulesError;
    }

    console.log(`Found ${schedules?.length} enabled schedules`);

    const now = new Date();
    const processedSchedules = [];

    for (const schedule of (schedules as Schedule[] || [])) {
      try {
        console.log(`Processing schedule ${schedule.id} (${schedule.function_name})`);
        
        if (!schedule.time_config) {
          console.log(`Schedule ${schedule.id} has no time_config, skipping...`);
          continue;
        }

        // Initialize next_execution_at if not set
        if (!schedule.next_execution_at) {
          console.log(`Initializing next_execution_at for schedule ${schedule.id}`);
          const nextExecution = calculateNextExecution(schedule, now);
          const { error: updateError } = await supabase
            .from('schedules')
            .update({
              next_execution_at: nextExecution.toISOString()
            })
            .eq('id', schedule.id);

          if (updateError) {
            console.error(`Error updating next_execution_at for schedule ${schedule.id}:`, updateError);
            continue;
          }
          console.log(`Set initial next_execution_at to ${nextExecution.toISOString()}`);
          continue;
        }

        const nextExecutionDate = new Date(schedule.next_execution_at);
        
        // Check if it's time to execute
        if (nextExecutionDate > now) {
          console.log(`Schedule ${schedule.id} next execution at ${nextExecutionDate.toISOString()} is in the future, skipping...`);
          continue;
        }

        console.log(`Executing schedule ${schedule.id} for function ${schedule.function_name}`);

        // Log execution start
        const { data: log, error: logError } = await supabase
          .from('schedule_execution_logs')
          .insert({
            schedule_id: schedule.id,
            started_at: new Date().toISOString(),
            status: 'running'
          })
          .select()
          .single();

        if (logError) {
          console.error('Error creating execution log:', logError);
          continue;
        }

        // Invoke the function
        const startTime = Date.now();
        console.log(`Invoking function ${schedule.function_name}`);
        const { data: result, error: invokeError } = await supabase.functions.invoke(
          schedule.function_name,
          {
            body: { scheduled: true }
          }
        );

        if (invokeError) {
          console.error(`Error invoking function ${schedule.function_name}:`, invokeError);
        }

        // Update execution log
        if (log) {
          const { error: logUpdateError } = await supabase
            .from('schedule_execution_logs')
            .update({
              completed_at: new Date().toISOString(),
              status: invokeError ? 'failed' : 'completed',
              error_details: invokeError?.message,
              execution_duration_ms: Date.now() - startTime
            })
            .eq('id', log.id);

          if (logUpdateError) {
            console.error('Error updating execution log:', logUpdateError);
          }
        }

        // Calculate and update next execution time
        const nextExecution = calculateNextExecution(schedule, now);
        const { error: scheduleUpdateError } = await supabase
          .from('schedules')
          .update({
            last_execution_at: now.toISOString(),
            next_execution_at: nextExecution.toISOString()
          })
          .eq('id', schedule.id);

        if (scheduleUpdateError) {
          console.error('Error updating schedule execution times:', scheduleUpdateError);
        } else {
          console.log(`Updated schedule ${schedule.id} with next execution at ${nextExecution.toISOString()}`);
        }

        processedSchedules.push(schedule.id);
        console.log(`Successfully processed schedule ${schedule.id}`);
      } catch (error) {
        console.error(`Error processing schedule ${schedule.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedSchedules.length,
        schedules: processedSchedules
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function calculateNextExecution(schedule: Schedule, now: Date): Date {
  const nextExecution = new Date(now);

  if (!schedule.time_config) return nextExecution;

  switch (schedule.time_config.type) {
    case 'interval':
      if (schedule.time_config.intervalMinutes) {
        nextExecution.setMinutes(nextExecution.getMinutes() + schedule.time_config.intervalMinutes);
      }
      break;

    case 'daily':
      if (typeof schedule.time_config.hour === 'number') {
        nextExecution.setHours(schedule.time_config.hour, 0, 0, 0);
        if (nextExecution <= now) {
          nextExecution.setDate(nextExecution.getDate() + 1);
        }
      }
      break;

    case 'weekly':
      // Add weekly logic if needed
      break;

    case 'monthly':
      // Add monthly logic if needed
      break;

    case 'cron':
      // Add cron logic if needed
      break;
  }

  return nextExecution;
}