import { supabase } from "@/integrations/supabase/client";

export const logFunctionExecution = async (functionName: string, started_at: string) => {
  try {
    const { data: schedules, error: scheduleError } = await supabase
      .from("schedules")
      .select("id")
      .eq("function_name", functionName);

    if (scheduleError) {
      console.error("Error getting schedule:", scheduleError);
      return;
    }

    let scheduleId = schedules?.[0]?.id;

    if (!scheduleId) {
      console.log(`Creating new schedule for ${functionName}`);
      const { data: newSchedule, error: createError } = await supabase
        .from("schedules")
        .insert({
          function_name: functionName,
          schedule_type: "event_based",
          enabled: true,
          event_config: {
            triggerType: "manual",
            offsetMinutes: 0
          },
          execution_config: {
            retry_count: 3,
            timeout_seconds: 30,
            retry_delay_seconds: 60,
            concurrent_execution: false
          }
        })
        .select("id")
        .single();

      if (createError) {
        console.error("Error creating schedule:", createError);
        return;
      }

      scheduleId = newSchedule.id;
    }

    const { error: logError } = await supabase
      .from("schedule_execution_logs")
      .insert({
        schedule_id: scheduleId,
        started_at,
        status: "running"
      });

    if (logError) {
      console.error("Error logging execution:", logError);
    }

    return scheduleId;
  } catch (error) {
    console.error("Error in logFunctionExecution:", error);
  }
};

export const updateExecutionLog = async (scheduleId: string, success: boolean, error?: string) => {
  try {
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
    }
  } catch (error) {
    console.error("Error in updateExecutionLog:", error);
  }
};