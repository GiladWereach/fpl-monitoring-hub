import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { logDebug, logError } from '../shared/logging-service.ts';

interface MatchWindow {
  type: 'live' | 'pre_match' | 'post_match' | 'idle';
  is_active: boolean;
  window_start: Date;
  window_end: Date;
  match_count: number;
  next_kickoff: Date | null;
}

interface StateChange {
  from: string;
  to: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { matchWindow, stateChange } = await req.json();
    logDebug('adjust-schedule-intervals', 'Processing state change:', { matchWindow, stateChange });

    // Get affected schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .eq('enabled', true)
      .eq('schedule_type', 'time_based')
      .filter('time_config->type', 'eq', 'match_dependent');

    if (schedulesError) {
      throw schedulesError;
    }

    const updates = [];
    for (const schedule of schedules) {
      let newInterval: number;
      
      if (matchWindow.is_active) {
        newInterval = schedule.time_config.matchDayIntervalMinutes || 2;
        logDebug('adjust-schedule-intervals', `Setting match day interval for ${schedule.function_name}: ${newInterval}min`);
      } else if (matchWindow.next_kickoff) {
        const timeToKickoff = Math.floor((new Date(matchWindow.next_kickoff).getTime() - Date.now()) / (1000 * 60));
        if (timeToKickoff <= 60) {
          newInterval = 15; // Check every 15 minutes approaching kickoff
          logDebug('adjust-schedule-intervals', `Setting pre-match interval for ${schedule.function_name}: ${newInterval}min`);
        } else {
          newInterval = schedule.time_config.nonMatchIntervalMinutes || 30;
          logDebug('adjust-schedule-intervals', `Setting non-match interval for ${schedule.function_name}: ${newInterval}min`);
        }
      } else {
        newInterval = schedule.time_config.nonMatchIntervalMinutes || 30;
        logDebug('adjust-schedule-intervals', `Setting default interval for ${schedule.function_name}: ${newInterval}min`);
      }

      const nextExecution = new Date();
      nextExecution.setMinutes(nextExecution.getMinutes() + newInterval);

      updates.push(
        supabase
          .from('schedules')
          .update({
            next_execution_at: nextExecution.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', schedule.id)
      );
    }

    // Execute all updates
    await Promise.all(updates);

    // Log the adjustment
    await supabase
      .from('api_health_metrics')
      .insert({
        endpoint: 'adjust_schedule_intervals',
        success_count: updates.length,
        error_count: 0,
        avg_response_time: 0,
        error_pattern: {
          state_change: stateChange,
          schedules_updated: updates.length
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        schedules_updated: updates.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

  } catch (error) {
    logError('adjust-schedule-intervals', 'Error adjusting schedules:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});