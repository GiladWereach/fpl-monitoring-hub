import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { logDebug, logError } from '../shared/logging-service.ts';

interface MatchWindow {
  window_start: Date;
  window_end: Date;
  is_active: boolean;
  match_count: number;
  next_kickoff: Date | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logDebug('monitor-match-windows', 'Starting match window monitoring cycle');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current match window state
    const { data: currentWindow, error: windowError } = await supabase
      .rpc('get_current_match_window')
      .maybeSingle();

    if (windowError) {
      logError('monitor-match-windows', 'Error getting current match window:', windowError);
      throw windowError;
    }

    // Get latest state from match_window_states
    const { data: latestState, error: stateError } = await supabase
      .from('match_window_states')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (stateError && stateError.code !== 'PGRST116') { // Ignore "no rows returned" error
      logError('monitor-match-windows', 'Error getting latest state:', stateError);
      throw stateError;
    }

    // Handle no active window case
    if (!currentWindow) {
      logDebug('monitor-match-windows', 'No active match window found');

      // If we had an active state before, record the transition to inactive
      if (latestState?.state === 'active') {
        const { error: insertError } = await supabase
          .from('match_window_states')
          .insert({
            state: 'inactive',
            start_time: new Date(),
            active_fixtures: 0,
            transition_type: 'window_closed',
            metadata: {
              previous_state: 'active',
              reason: 'no_active_matches'
            }
          });

        if (insertError) {
          logError('monitor-match-windows', 'Error inserting inactive state:', insertError);
          throw insertError;
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          stateChanged: latestState?.state === 'active',
          currentWindow: null,
          status: 'no_active_matches'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Determine if state has changed
    const hasStateChanged = !latestState || 
      latestState.state !== (currentWindow.is_active ? 'active' : 'inactive') ||
      latestState.active_fixtures !== currentWindow.match_count;

    if (hasStateChanged) {
      logDebug('monitor-match-windows', 'Match window state change detected', {
        previous: latestState,
        current: currentWindow
      });

      // Insert new state
      const { error: insertError } = await supabase
        .from('match_window_states')
        .insert({
          state: currentWindow.is_active ? 'active' : 'inactive',
          start_time: currentWindow.window_start,
          end_time: currentWindow.window_end,
          active_fixtures: currentWindow.match_count,
          transition_type: !latestState ? 'initial' : 
                         currentWindow.is_active ? 'window_opened' : 'window_closed',
          metadata: {
            next_kickoff: currentWindow.next_kickoff,
            previous_state: latestState?.state || null,
            match_count: currentWindow.match_count
          }
        });

      if (insertError) {
        logError('monitor-match-windows', 'Error inserting new state:', insertError);
        throw insertError;
      }

      // Trigger schedule interval updates if needed
      if (currentWindow.is_active !== (latestState?.state === 'active')) {
        try {
          const { error: scheduleError } = await supabase.functions.invoke('adjust-schedule-intervals', {
            body: { 
              matchWindow: currentWindow,
              stateChange: {
                from: latestState?.state || 'inactive',
                to: currentWindow.is_active ? 'active' : 'inactive'
              }
            }
          });

          if (scheduleError) {
            logError('monitor-match-windows', 'Error adjusting schedules:', scheduleError);
            throw scheduleError;
          }
        } catch (error) {
          logError('monitor-match-windows', 'Error invoking adjust-schedule-intervals:', error);
          // Don't throw here, we want to return the state change even if schedule adjustment fails
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      stateChanged: hasStateChanged,
      currentWindow,
      previousState: latestState
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logError('monitor-match-windows', 'Error monitoring match windows:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});