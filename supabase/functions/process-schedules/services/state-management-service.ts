import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../../../shared/logging-service.ts';

export type ScheduleState = 'idle' | 'scheduled' | 'pending' | 'executing' | 'completed' | 'failed' | 'retry' | 'max_retries';

interface StateTransition {
  schedule_id: string;
  from_state: ScheduleState;
  to_state: ScheduleState;
  metadata?: Record<string, any>;
}

export async function transitionState(
  client: SupabaseClient,
  transition: StateTransition
): Promise<boolean> {
  const { schedule_id, from_state, to_state, metadata = {} } = transition;
  
  try {
    logDebug('state-management', `Transitioning schedule ${schedule_id} from ${from_state} to ${to_state}`);
    
    // Insert new state
    const { error: insertError } = await client
      .from('schedule_states')
      .insert({
        schedule_id,
        state: to_state,
        metadata,
        transition_time: new Date().toISOString()
      });

    if (insertError) throw insertError;

    // Update schedule execution log
    const { error: logError } = await client
      .from('schedule_execution_logs')
      .insert({
        schedule_id,
        status: to_state,
        execution_context: {
          previous_state: from_state,
          transition_metadata: metadata
        }
      });

    if (logError) {
      logError('state-management', `Error updating execution log: ${logError.message}`, logError);
    }

    logDebug('state-management', `Successfully transitioned schedule ${schedule_id} to ${to_state}`);
    return true;
  } catch (error) {
    logError('state-management', `Failed to transition state for schedule ${schedule_id}:`, error);
    throw error;
  }
}

export async function getCurrentState(
  client: SupabaseClient,
  schedule_id: string
): Promise<ScheduleState> {
  try {
    const { data, error } = await client
      .from('schedule_states')
      .select('state')
      .eq('schedule_id', schedule_id)
      .order('transition_time', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data?.state || 'idle';
  } catch (error) {
    logError('state-management', `Error getting current state for schedule ${schedule_id}:`, error);
    throw error;
  }
}

export async function validateStateTransition(
  from_state: ScheduleState,
  to_state: ScheduleState
): Promise<boolean> {
  const validTransitions: Record<ScheduleState, ScheduleState[]> = {
    'idle': ['scheduled'],
    'scheduled': ['pending', 'failed'],
    'pending': ['executing', 'failed'],
    'executing': ['completed', 'failed', 'retry'],
    'completed': ['idle', 'scheduled'],
    'failed': ['retry', 'max_retries', 'idle'],
    'retry': ['pending'],
    'max_retries': ['idle']
  };

  return validTransitions[from_state]?.includes(to_state) || false;
}