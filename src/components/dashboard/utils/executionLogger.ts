import { supabase } from "@/integrations/supabase/client";

export const logFunctionExecution = async (functionName: string, started_at: string) => {
  try {
    // First try to find an existing schedule in the schedules table
    const { data: schedules, error: scheduleError } = await supabase
      .from("schedules")
      .select("id")
      .eq("function_name", functionName)
      .single();

    if (scheduleError && scheduleError.code !== 'PGRST116') {
      console.error("Error getting schedule:", scheduleError);
      return;
    }

    let scheduleId = schedules?.id;

    // If no schedule exists, create one
    if (!scheduleId) {
      console.log(`Creating new schedule for ${functionName}`);
      const { data: newSchedule, error: createError } = await supabase
        .from("schedules")
        .insert({
          function_name: functionName,
          schedule_type: "time_based",
          enabled: true,
          timezone: "UTC",
          execution_config: {
            retry_count: 3,
            timeout_seconds: 30,
            retry_delay_seconds: 60,
            concurrent_execution: false,
            retry_backoff: "linear",
            max_retry_delay: 3600
          }
        })
        .select("id")
        .single();

      if (createError) {
        console.error("Error creating schedule:", createError);
        return;
      }

      scheduleId = newSchedule.id;
      console.log(`Created new schedule with ID: ${scheduleId}`);
    }

    // Log the execution
    const { error: logError } = await supabase
      .from("schedule_execution_logs")
      .insert({
        schedule_id: scheduleId,
        started_at,
        status: "running"
      });

    if (logError) {
      console.error("Error logging execution:", logError);
    } else {
      console.log(`Successfully logged execution for schedule ${scheduleId}`);
    }

    return scheduleId;
  } catch (error) {
    console.error("Error in logFunctionExecution:", error);
  }
};

export const updateExecutionLog = async (scheduleId: string, success: boolean, error?: string) => {
  try {
    console.log(`Updating execution log for schedule ${scheduleId}, success: ${success}`);
    
    const { error: updateError } = await supabase
      .from("schedule_execution_logs")
      .update({
        completed_at: new Date().toISOString(),
        status: success ? "completed" : "failed",
        error_details: error,
        execution_duration_ms: Date.now() - new Date().getTime()
      })
      .eq("schedule_id", scheduleId)
      .is("completed_at", null);

    if (updateError) {
      console.error("Error updating execution log:", updateError);
    } else {
      console.log(`Successfully updated execution log for schedule ${scheduleId}`);
    }
  } catch (error) {
    console.error("Error in updateExecutionLog:", error);
  }
};