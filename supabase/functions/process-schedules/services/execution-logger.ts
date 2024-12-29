import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../../../shared/logging-service.ts';

export interface ExecutionContext {
  instance_id: string;
  schedule_type: string;
  execution_attempt: number;
  started_at: string;
  state_transitions?: Array<{
    from: string;
    to: string;
    timestamp: string;
  }>;
}

export async function createExecutionLog(
  client: ReturnType<typeof createClient>,
  scheduleId: string,
  context: ExecutionContext
) {
  logDebug('execution-logger', `Creating execution log for schedule ${scheduleId}`);
  
  try {
    const { data: log, error } = await client
      .from('schedule_execution_logs')
      .insert({
        schedule_id: scheduleId,
        status: 'running',
        execution_context: context
      })
      .select()
      .single();

    if (error) {
      logError('execution-logger', `Error creating execution log: ${error.message}`);
      throw error;
    }

    return log;
  } catch (error) {
    logError('execution-logger', 'Failed to create execution log:', error);
    throw error;
  }
}

export async function updateExecutionLog(
  client: ReturnType<typeof createClient>,
  logId: string,
  status: string,
  details: {
    error?: string;
    duration?: number;
    state_transition?: {
      from: string;
      to: string;
    };
  }
) {
  logDebug('execution-logger', `Updating execution log ${logId} with status: ${status}`);
  
  try {
    const { error } = await client
      .from('schedule_execution_logs')
      .update({
        status,
        completed_at: new Date().toISOString(),
        error_details: details.error,
        execution_duration_ms: details.duration,
        execution_context: details.state_transition ? {
          state_transition: {
            ...details.state_transition,
            timestamp: new Date().toISOString()
          }
        } : undefined
      })
      .eq('id', logId);

    if (error) {
      logError('execution-logger', `Error updating execution log: ${error.message}`);
      throw error;
    }
  } catch (error) {
    logError('execution-logger', 'Failed to update execution log:', error);
    throw error;
  }
}