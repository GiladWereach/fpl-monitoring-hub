import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../../_shared/logging-service.ts';

export type ScheduleState = 'idle' | 'scheduled' | 'pending' | 'executing' | 'completed' | 'failed' | 'retry' | 'max_retries';

interface StateTransition {
  schedule_id: string;
  from_state: ScheduleState;
  to_state: ScheduleState;
  metadata?: Record<string, any>;
}

export async function getCurrentState(supabase: SupabaseClient, scheduleId: string): Promise<ScheduleState> {
  try {
    const { data, error } = await supabase
      .from('schedule_states')
      .select('state')
      .eq('schedule_id', scheduleId)
      .order('transition_time', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data?.state || 'idle';
  } catch (error) {
    logError('getCurrentState', `Error getting state for schedule ${scheduleId}:`, error);
    return 'idle';
  }
}

export async function transitionState(supabase: SupabaseClient, transition: StateTransition): Promise<void> {
  try {
    logDebug('transitionState', `Transitioning schedule ${transition.schedule_id} from ${transition.from_state} to ${transition.to_state}`);
    
    const { error } = await supabase
      .from('schedule_states')
      .insert({
        schedule_id: transition.schedule_id,
        state: transition.to_state,
        metadata: transition.metadata || {}
      });

    if (error) throw error;
    
    logDebug('transitionState', `Successfully transitioned schedule ${transition.schedule_id} to ${transition.to_state}`);
  } catch (error) {
    logError('transitionState', `Failed to transition schedule ${transition.schedule_id}:`, error);
    throw error;
  }
}