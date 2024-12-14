import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Play, Clock } from "lucide-react";

interface ExecutionHistoryProps {
  functionName: string;
}

export function ExecutionHistory({ functionName }: ExecutionHistoryProps) {
  const { data: executions } = useQuery({
    queryKey: ["executions", functionName],
    queryFn: async () => {
      console.log(`Fetching execution history for ${functionName}`);
      const { data, error } = await supabase
        .from("schedule_execution_logs")
        .select("*")
        .eq("schedule_id", (await supabase
          .from("schedules")
          .select("id")
          .eq("function_name", functionName)
          .single()).data?.id)
        .order("started_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error(`Error fetching execution history for ${functionName}:`, error);
        throw error;
      }

      return data;
    },
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