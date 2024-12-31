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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    logDebug('monitor-match-windows', 'Starting match window monitoring cycle');

    // Get current match window state
    const { data: currentWindow, error: windowError } = await supabase
      .rpc('get_current_match_window')
      .maybeSingle();

    if (windowError) {
      throw windowError;
    }

    // Handle no active window case
    if (!currentWindow) {
      logDebug('monitor-match-windows', 'No active match window found');
      return new Response(
        JSON.stringify({
          success: true,
          stateChanged: false,
          currentWindow: null,
          status: 'no_active_matches'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Get latest state from match_window_states
    const { data: latestState, error: stateError } = await supabase
      .from('match_window_states')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (stateError && stateError.code !== 'PGRST116') { // Ignore "no rows returned" error
      throw stateError;
    }

    // Determine if state has changed
    const hasStateChanged = !latestState || 
      latestState.is_active !== currentWindow.is_active ||
      latestState.match_count !== currentWindow.match_count;

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
          metadata: {
            next_kickoff: currentWindow.next_kickoff,
            previous_state: latestState?.state || null
          }
        });

      if (insertError) {
        throw insertError;
      }

      // Trigger schedule interval updates
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
        throw scheduleError;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      stateChanged: hasStateChanged,
      currentWindow
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logError('monitor-match-windows', 'Error monitoring match windows:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});