import { supabase } from "@/integrations/supabase/client";

export const logFunctionExecution = async (functionName: string, started_at: string) => {
  try {
    console.log(`Attempting to log execution for function: ${functionName}`);
    
    // First check if schedule exists
    const { data: existingSchedule, error: findError } = await supabase
      .from("schedules")
      .select("id")
      .eq("function_name", functionName)
      .maybeSingle();

    if (findError && findError.code !== 'PGRST116') {
      console.error("Error checking for existing schedule:", findError);
      throw findError;
    }

    let scheduleId = existingSchedule?.id;

    // If no schedule exists, create one
    if (!scheduleId) {
      console.log(`No schedule found for ${functionName}, creating new schedule`);
      const { data: newSchedule, error: createError } = await supabase
        .from("schedules")
        .insert({
          function_name: functionName,
          schedule_type: "time_based",
          enabled: true,
          timezone: "UTC",
          time_config: {
            type: "interval",
            intervalMinutes: 5
          },
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
        throw createError;
      }

      scheduleId = newSchedule.id;
      console.log(`Successfully created new schedule with ID: ${scheduleId}`);
    }

    // Verify schedule exists before logging
    const { data: verifySchedule, error: verifyError } = await supabase
      .from("schedules")
      .select("id")
      .eq("id", scheduleId)
      .single();

    if (verifyError || !verifySchedule) {
      console.error("Failed to verify schedule exists:", verifyError);
      throw new Error("Schedule verification failed");
    }

    // Create execution log
    console.log(`Creating execution log for schedule ${scheduleId}`);
    const { error: logError } = await supabase
      .from("schedule_execution_logs")
      .insert({
        schedule_id: scheduleId,
        started_at,
        status: "running"
      });

    if (logError) {
      console.error("Error creating execution log:", logError);
      throw logError;
    }

    console.log(`Successfully created execution log for schedule ${scheduleId}`);
    return scheduleId;
  } catch (error) {
    console.error("Error in logFunctionExecution:", error);
    throw error;
  }
};

export const updateExecutionLog = async (scheduleId: string, success: boolean, error?: string) => {
  try {
    console.log(`Updating execution log for schedule ${scheduleId}, success: ${success}`);
    
    // Verify schedule exists before updating
    const { data: verifySchedule, error: verifyError } = await supabase
      .from("schedules")
      .select("id")
      .eq("id", scheduleId)
      .single();

    if (verifyError || !verifySchedule) {
      console.error("Failed to verify schedule exists for update:", verifyError);
      throw new Error("Schedule verification failed");
    }

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
      throw updateError;
    }

    console.log(`Successfully updated execution log for schedule ${scheduleId}`);
  } catch (error) {
    console.error("Error in updateExecutionLog:", error);
    throw error;
  }
};