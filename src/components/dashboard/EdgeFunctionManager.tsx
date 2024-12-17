import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Play, RefreshCw } from "lucide-react";
import { ScheduleManager } from "./ScheduleManager";

const functions = [
  { name: "Teams", function: "fetch-teams" },
  { name: "Events", function: "fetch-events" },
  { name: "Game Settings", function: "fetch-game-settings" },
  { name: "Element Types", function: "fetch-element-types" },
  { name: "Chips", function: "fetch-chips" },
  { name: "Players", function: "fetch-players" },
  { name: "Player Details", function: "fetch-player-details" },
  { name: "Scoring Rules", function: "fetch-scoring-rules" },
  { name: "Fixtures", function: "fetch-fixtures" },
];

export function EdgeFunctionManager() {
  const [loading, setLoading] = useState<string | null>(null);

  const logFunctionExecution = async (functionName: string, started_at: string) => {
    try {
      // First get or create a manual schedule for this function
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
      }

      return scheduleId;
    } catch (error) {
      console.error("Error in logFunctionExecution:", error);
    }
  };

  const updateExecutionLog = async (scheduleId: string, success: boolean, error?: string) => {
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

  const invokeFetchFunction = async (functionName: string) => {
    const started_at = new Date().toISOString();
    let scheduleId: string | undefined;

    try {
      setLoading(functionName);
      scheduleId = await logFunctionExecution(functionName, started_at);
      
      const { data, error } = await supabase.functions.invoke(functionName);
      
      if (error) throw error;
      
      if (scheduleId) {
        await updateExecutionLog(scheduleId, true);
      }

      toast({
        title: "Success",
        description: `${functionName} executed successfully`,
      });
    } catch (error) {
      console.error(`Error invoking ${functionName}:`, error);
      
      if (scheduleId) {
        await updateExecutionLog(scheduleId, false, error.message);
      }

      toast({
        title: "Error",
        description: `Failed to execute ${functionName}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const refreshAll = async () => {
    setLoading("all");
    for (const func of functions) {
      try {
        await invokeFetchFunction(func.function);
      } catch (error) {
        console.error(`Error in refresh all for ${func.function}:`, error);
      }
    }
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Edge Functions Manager</h2>
        <Button
          onClick={refreshAll}
          disabled={loading !== null}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {functions.map((func) => (
          <div
            key={func.function}
            className="glass-card p-4 rounded-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{func.name}</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => invokeFetchFunction(func.function)}
                  disabled={loading !== null}
                >
                  {loading === func.function ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <ScheduleManager
                  functionName={func.function}
                  functionDisplayName={func.name}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}