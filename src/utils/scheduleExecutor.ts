import { supabase } from "@/integrations/supabase/client";
import { determineScheduleFrequency } from "./scheduleManager";
import { toast } from "@/hooks/use-toast";

export async function updateScheduleConfiguration(functionName: string) {
  console.log(`Updating schedule configuration for ${functionName}`);
  
  try {
    const frequency = await determineScheduleFrequency(functionName);
    
    // Update the schedule configuration
    const { error } = await supabase
      .from('function_schedules')
      .upsert({
        function_name: functionName,
        frequency_type: 'match_dependent',
        base_interval_minutes: frequency.intervalMinutes,
        match_day_interval_minutes: 2,
        non_match_interval_minutes: 30,
        status: 'active',
        max_concurrent_executions: 1,
        timeout_seconds: 30,
        retry_count: 3,
        retry_delay_seconds: 60,
        active_period_start: frequency.startTime,
        active_period_end: frequency.endTime,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'function_name'
      });

    if (error) throw error;

    console.log(`Schedule updated for ${functionName}:`, frequency);
    return frequency;
  } catch (error) {
    console.error(`Error updating schedule for ${functionName}:`, error);
    toast({
      title: "Schedule Update Error",
      description: `Failed to update schedule for ${functionName}`,
      variant: "destructive",
    });
    throw error;
  }
}

export async function executeScheduledFunction(functionName: string) {
  console.log(`Executing scheduled function: ${functionName}`);
  
  try {
    // Update schedule before execution
    await updateScheduleConfiguration(functionName);

    // Execute the function
    const { data, error } = await supabase.functions.invoke(functionName);
    
    if (error) throw error;

    // Log successful execution
    await supabase
      .from('schedule_execution_logs')
      .insert({
        schedule_id: functionName,
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });

    console.log(`Successfully executed ${functionName}`);
    return data;
  } catch (error) {
    console.error(`Error executing ${functionName}:`, error);
    
    // Log failed execution
    await supabase
      .from('schedule_execution_logs')
      .insert({
        schedule_id: functionName,
        status: 'failed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        error_details: error.message
      });

    throw error;
  }
}