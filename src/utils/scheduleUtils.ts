import { supabase } from "@/integrations/supabase/client";

export const ensureScheduleExists = async (functionName: string) => {
  console.log(`Checking for existing schedule for ${functionName}`);
  
  const { data: existingSchedule } = await supabase
    .from('schedules')
    .select('id')
    .eq('function_name', functionName)
    .maybeSingle();

  if (existingSchedule) {
    console.log(`Found existing schedule for ${functionName}`);
    return existingSchedule.id;
  }

  console.log(`Creating new schedule for ${functionName}`);
  const { data: newSchedule, error: createError } = await supabase
    .from('schedules')
    .insert({
      function_name: functionName,
      schedule_type: 'event_based',
      enabled: true,
      timezone: 'UTC',
      event_config: {
        triggerType: 'manual',
        offsetMinutes: 0
      },
      execution_config: {
        retry_count: 3,
        timeout_seconds: 30,
        retry_delay_seconds: 60,
        concurrent_execution: false,
        retry_backoff: 'linear',
        max_retry_delay: 3600
      }
    })
    .select('id')
    .single();

  if (createError) {
    console.error('Error creating schedule:', createError);
    throw createError;
  }

  return newSchedule.id;
};

export const createExecutionLog = async (scheduleId: string, status: string = 'running') => {
  console.log(`Creating execution log for schedule ${scheduleId}`);
  const { data: log, error } = await supabase
    .from('schedule_execution_logs')
    .insert({
      schedule_id: scheduleId,
      started_at: new Date().toISOString(),
      status
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating execution log:', error);
    throw error;
  }

  return log;
};

export const updateExecutionLog = async (logId: string, success: boolean) => {
  console.log(`Updating execution log ${logId}`);
  const { error } = await supabase
    .from('schedule_execution_logs')
    .update({
      status: success ? 'completed' : 'failed',
      completed_at: new Date().toISOString()
    })
    .eq('id', logId);

  if (error) {
    console.error('Error updating execution log:', error);
    throw error;
  }
};