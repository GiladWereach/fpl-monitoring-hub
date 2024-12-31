import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError, logInfo } from '../../_shared/logging-service.ts';

export type ScheduleState = 'idle' | 'scheduled' | 'pending' | 'running' | 'completed' | 'failed' | 'retry' | 'max_retries';

interface StateTransition {
  schedule_id: string;
  from_state: ScheduleState;
  to_state: ScheduleState;
  metadata?: Record<string, any>;
}

const VALID_TRANSITIONS: Record<ScheduleState, ScheduleState[]> = {
  'idle': ['pending', 'scheduled'],
  'scheduled': ['pending'],
  'pending': ['running', 'failed'],
  'running': ['completed', 'failed'],
  'completed': ['idle'],
  'failed': ['retry', 'idle'],
  'retry': ['pending', 'max_retries'],
  'max_retries': ['idle']
};

const STATE_TIMEOUTS: Record<ScheduleState, number> = {
  'pending': 5 * 60, // 5 minutes
  'running': 30 * 60, // 30 minutes
  'retry': 15 * 60, // 15 minutes
  'scheduled': 60 * 60, // 1 hour
  'idle': 24 * 60 * 60, // 24 hours
  'completed': 5 * 60, // 5 minutes
  'failed': 15 * 60, // 15 minutes
  'max_retries': 60 * 60 // 1 hour
};

export async function getCurrentState(supabase: SupabaseClient, scheduleId: string): Promise<ScheduleState> {
  try {
    const { data, error } = await supabase
      .from('schedule_states')
      .select('state, transition_time')
      .eq('schedule_id', scheduleId)
      .order('transition_time', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    // Check for stuck states
    if (data) {
      const stateAge = (Date.now() - new Date(data.transition_time).getTime()) / 1000;
      if (stateAge > STATE_TIMEOUTS[data.state as ScheduleState]) {
        logInfo('getCurrentState', `State ${data.state} timed out after ${stateAge}s, resetting to idle`, {
          scheduleId,
          previousState: data.state
        });
        await transitionState(supabase, {
          schedule_id: scheduleId,
          from_state: data.state as ScheduleState,
          to_state: 'idle',
          metadata: { reason: 'state_timeout', timeout_seconds: STATE_TIMEOUTS[data.state as ScheduleState] }
        });
        return 'idle';
      }
    }

    return (data?.state as ScheduleState) || 'idle';
  } catch (error) {
    logError('getCurrentState', `Error getting state for schedule ${scheduleId}:`, error);
    return 'idle';
  }
}

export async function transitionState(supabase: SupabaseClient, transition: StateTransition): Promise<void> {
  try {
    const currentState = await getCurrentState(supabase, transition.schedule_id);
    
    // Validate transition
    if (!VALID_TRANSITIONS[currentState]?.includes(transition.to_state)) {
      throw new Error(`Invalid state transition from ${currentState} to ${transition.to_state}`);
    }

    logDebug('transitionState', `Transitioning schedule ${transition.schedule_id} from ${currentState} to ${transition.to_state}`);
    
    const { error: insertError } = await supabase
      .from('schedule_states')
      .insert({
        schedule_id: transition.schedule_id,
        state: transition.to_state,
        metadata: {
          ...transition.metadata,
          previous_state: currentState,
          transition_timestamp: new Date().toISOString()
        }
      });

    if (insertError) throw insertError;

    // Update schedule next_execution_at if transitioning to idle
    if (transition.to_state === 'idle') {
      const { error: updateError } = await supabase
        .from('schedules')
        .update({
          next_execution_at: calculateNextExecutionTime(transition.metadata?.schedule_config)
        })
        .eq('id', transition.schedule_id);

      if (updateError) throw updateError;
    }
    
    logDebug('transitionState', `Successfully transitioned schedule ${transition.schedule_id} to ${transition.to_state}`);
  } catch (error) {
    logError('transitionState', `Failed to transition schedule ${transition.schedule_id}:`, error);
    throw error;
  }
}

function calculateNextExecutionTime(config?: any): string {
  const now = new Date();
  const intervalMinutes = config?.intervalMinutes || 30;
  return new Date(now.getTime() + intervalMinutes * 60000).toISOString();
}

export async function cleanupStaleStates(supabase: SupabaseClient): Promise<void> {
  try {
    const { data: staleStates, error } = await supabase
      .from('schedule_states')
      .select('schedule_id, state, transition_time')
      .order('transition_time', { ascending: false });

    if (error) throw error;

    const processedSchedules = new Set();
    const now = Date.now();

    for (const state of staleStates) {
      if (processedSchedules.has(state.schedule_id)) continue;
      
      const stateAge = (now - new Date(state.transition_time).getTime()) / 1000;
      if (stateAge > STATE_TIMEOUTS[state.state as ScheduleState]) {
        await transitionState(supabase, {
          schedule_id: state.schedule_id,
          from_state: state.state as ScheduleState,
          to_state: 'idle',
          metadata: { reason: 'cleanup_stale_state' }
        });
      }
      
      processedSchedules.add(state.schedule_id);
    }
  } catch (error) {
    logError('cleanupStaleStates', 'Error cleaning up stale states:', error);
  }
}