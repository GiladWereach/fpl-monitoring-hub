import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Activity, CheckCircle2, XCircle } from "lucide-react";

export function RecentActivity() {
  const { data: executions } = useQuery({
    queryKey: ["recent-executions"],
    queryFn: async () => {
      console.log("Fetching recent executions");
      const { data, error } = await supabase
        .from("schedule_execution_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching recent executions:", error);
        throw error;
      }

      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <div className="glass-card rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {executions?.map((execution) => (
          <div
            key={execution.id}
            className="flex items-center justify-between py-2 border-b last:border-0"
          >
            <div className="flex items-center gap-3">
              {execution.status === "completed" ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <div>
                <span className="font-medium">{execution.function_name}</span>
                <p className="text-sm text-muted-foreground">
                  Duration: {execution.execution_duration_ms}ms
                </p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">
              {format(new Date(execution.started_at), "HH:mm:ss")}
            </span>
          </div>
        ))}
        {!executions?.length && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>No recent activity</span>
          </div>
        )}
      </div>
    </div>
  );
}