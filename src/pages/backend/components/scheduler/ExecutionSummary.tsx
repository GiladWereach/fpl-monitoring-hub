import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ExecutionSummary() {
  const { data: executions, isLoading } = useQuery({
    queryKey: ['recent-executions'],
    queryFn: async () => {
      console.log('Fetching recent executions');
      const { data, error } = await supabase
        .from('schedule_execution_logs')
        .select(`
          *,
          schedules (
            function_name
          )
        `)
        .order('started_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      console.log('Fetched executions:', data);
      return data;
    },
    refetchInterval: 15000
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-[200px] w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Executions</h2>
      <div className="space-y-4">
        {executions?.map((execution) => (
          <div
            key={execution.id}
            className="flex items-center justify-between p-3 bg-card rounded-lg border"
          >
            <div className="flex items-center gap-3">
              {execution.status === 'completed' ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : execution.status === 'running' ? (
                <Clock className="h-5 w-5 text-blue-500 animate-spin" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <div>
                <p className="font-medium">{execution.schedules?.function_name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(execution.started_at), "MMM d, HH:mm:ss")}
                </p>
              </div>
            </div>
            <span className={`text-sm ${
              execution.status === 'completed' ? 'text-success' :
              execution.status === 'running' ? 'text-blue-500' :
              'text-destructive'
            }`}>
              {execution.status}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}