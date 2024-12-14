import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Play, Clock } from "lucide-react";

interface ExecutionHistoryProps {
  functionName: string;
}

export function ExecutionHistory({ functionName }: ExecutionHistoryProps) {
  // First query to get the schedule
  const { data: schedule } = useQuery({
    queryKey: ["schedule", functionName],
    queryFn: async () => {
      console.log(`Fetching schedule for ${functionName}`);
      const { data, error } = await supabase
        .from("schedules")
        .select("id")
        .eq("function_name", functionName)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching schedule for ${functionName}:`, error);
        return null;
      }

      return data;
    },
  });

  // Only fetch execution logs if we have a valid schedule
  const { data: executions } = useQuery({
    queryKey: ["executions", functionName, schedule?.id],
    queryFn: async () => {
      if (!schedule?.id) {
        console.log(`No schedule found for ${functionName}, skipping execution history fetch`);
        return [];
      }

      console.log(`Fetching execution history for ${functionName}`);
      const { data, error } = await supabase
        .from("schedule_execution_logs")
        .select("*")
        .eq("schedule_id", schedule.id)
        .order("started_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error(`Error fetching execution history for ${functionName}:`, error);
        throw error;
      }

      return data;
    },
    enabled: !!schedule?.id, // Only run this query if we have a schedule id
  });

  if (!executions?.length) return null;

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-sm font-medium">Recent Executions</h4>
      <div className="space-y-2">
        {executions.map((execution) => (
          <div
            key={execution.id}
            className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50"
          >
            <div className="flex items-center gap-2">
              {execution.status === "completed" ? (
                <Play className="h-3 w-3 text-green-500" />
              ) : (
                <Clock className="h-3 w-3 text-yellow-500" />
              )}
              <span>
                {format(new Date(execution.started_at), "MMM d, yyyy HH:mm:ss")}
              </span>
            </div>
            <span
              className={
                execution.status === "completed"
                  ? "text-green-500"
                  : "text-yellow-500"
              }
            >
              {execution.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}