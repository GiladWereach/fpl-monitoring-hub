import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "../ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Timer, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

export function ScheduleStatus() {
  const { data: schedules, error } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      console.log('Fetching schedules status');
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          schedule_execution_logs!inner (
            id,
            status,
            started_at,
            completed_at,
            error_details,
            execution_duration_ms
          )
        `)
        .order('function_name');

      if (error) {
        console.error('Error fetching schedules:', error);
        toast({
          title: "Error fetching schedules",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      console.log('Current schedules:', data);
      return data;
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  if (error) {
    return (
      <Card className="p-4 bg-destructive/10 text-destructive">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <p>Error loading schedules: {error.message}</p>
        </div>
      </Card>
    );
  }

  if (!schedules?.length) {
    return <div className="text-center p-4">No schedules configured</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {schedules.map((schedule) => {
        const lastExecution = schedule.schedule_execution_logs?.[0];
        const isRunning = lastExecution?.status === 'running';
        const isSuccess = lastExecution?.status === 'completed';
        const hasError = lastExecution?.status === 'failed';
        
        return (
          <Card key={schedule.id} className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold truncate">{schedule.function_name}</h3>
                <div className={cn(
                  "px-2 py-1 rounded-full text-xs flex items-center gap-1",
                  isRunning ? "bg-blue-500/20 text-blue-500" :
                  isSuccess ? "bg-success/20 text-success" :
                  "bg-destructive/20 text-destructive"
                )}>
                  {isRunning ? (
                    <>
                      <Timer className="h-3 w-3 animate-spin" />
                      Running
                    </>
                  ) : isSuccess ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      Success
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      Failed
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="truncate">
                  Last run: {schedule.last_execution_at ? 
                    format(new Date(schedule.last_execution_at), 'HH:mm:ss dd/MM/yyyy') : 
                    'Never'
                  }
                </p>
                <p className="truncate">
                  Next run: {schedule.next_execution_at ? 
                    format(new Date(schedule.next_execution_at), 'HH:mm:ss dd/MM/yyyy') : 
                    'Not scheduled'
                  }
                </p>
                {lastExecution?.execution_duration_ms && (
                  <p className="truncate">
                    Duration: {lastExecution.execution_duration_ms}ms
                  </p>
                )}
                {hasError && lastExecution?.error_details && (
                  <p className="text-destructive truncate">
                    Error: {lastExecution.error_details}
                  </p>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}