import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface ExecutionHistoryProps {
  functionName: string;
}

export function ExecutionHistory({ functionName }: ExecutionHistoryProps) {
  // First query to get the schedule ID
  const { data: schedule } = useQuery({
    queryKey: ['schedule', functionName],
    queryFn: async () => {
      console.log(`Fetching schedule for ${functionName}`);
      const { data, error } = await supabase
        .from('schedules')
        .select('id')
        .eq('function_name', functionName)
        .single();

      if (error) {
        console.error(`Error fetching schedule for ${functionName}:`, error);
        return null;
      }
      return data;
    }
  });

  // Then query execution logs using the schedule ID
  const { data: executions } = useQuery({
    queryKey: ['execution-logs', schedule?.id],
    queryFn: async () => {
      if (!schedule?.id) return [];
      
      console.log(`Fetching execution logs for schedule ${schedule.id}`);
      const { data, error } = await supabase
        .from('schedule_execution_logs')
        .select('*')
        .eq('schedule_id', schedule.id)
        .order('started_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching execution logs:', error);
        throw error;
      }

      return data;
    },
    enabled: !!schedule?.id
  });

  if (!executions?.length) {
    return (
      <Card className="mt-6 p-4">
        <p className="text-sm text-muted-foreground">No execution history available</p>
      </Card>
    );
  }

  return (
    <Card className="mt-6 p-4">
      <h3 className="text-sm font-medium mb-4">Recent Executions</h3>
      <div className="space-y-2">
        {executions.map((execution) => (
          <Alert key={execution.id} variant={execution.status === 'completed' ? 'default' : 'destructive'}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {execution.status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : execution.status === 'running' ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {format(new Date(execution.started_at), "MMM d, HH:mm:ss")}
                  {execution.completed_at && (
                    <> ({((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000).toFixed(2)}s)</>
                  )}
                </AlertDescription>
              </div>
              <span className={execution.status === 'completed' ? 'text-success' : 'text-destructive'}>
                {execution.status}
              </span>
            </div>
            {execution.error_details && (
              <AlertDescription className="mt-2 text-sm text-destructive">
                Error: {execution.error_details}
              </AlertDescription>
            )}
          </Alert>
        ))}
      </div>
    </Card>
  );
}