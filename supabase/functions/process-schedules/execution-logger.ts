import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ExecutionContext } from './types.ts';

export async function createExecutionLog(
  supabaseClient: ReturnType<typeof createClient>,
  scheduleId: string,
  context: ExecutionContext
) {
  console.log(`Creating execution log for schedule ${scheduleId}`);
  
  const { data: log, error } = await supabaseClient
    .from('schedule_execution_logs')
    .insert({
      schedule_id: scheduleId,
      started_at: new Date().toISOString(),
      status: 'running',
      execution_context: context
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating execution log:', error);
    throw error;
  }

  return log;
}

export async function updateExecutionLog(
  supabaseClient: ReturnType<typeof createClient>,
  logId: string,
  success: boolean,
  duration: number,
  error?: string
) {
  console.log(`Updating execution log ${logId}, success: ${success}`);
  
  const { error: updateError } = await supabaseClient
    .from('schedule_execution_logs')
    .update({
      completed_at: new Date().toISOString(),
      status: success ? 'completed' : 'failed',
      error_details: error,
      execution_duration_ms: duration
    })
    .eq('id', logId);

  if (updateError) {
    console.error('Error updating execution log:', updateError);
    throw updateError;
  }
}