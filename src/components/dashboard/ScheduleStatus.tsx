import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "../ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Timer } from "lucide-react";
import { format } from "date-fns";

export function ScheduleStatus() {
  const { data: schedules } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          schedule_execution_logs!inner (
            id,
            status,
            started_at,
            completed_at,
            error_details
          )
        `)
        .order('function_name');

      if (error) throw error;
      console.log('Current schedules:', data);
      return data;
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  if (!schedules?.length) {
    return <div className="text-center p-4">No schedules configured</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {schedules.map((schedule) => {
        const lastExecution = schedule.schedule_execution_logs?.[0];
        const isRunning = lastExecution?.status === 'running';
        const isSuccess = lastExecution?.status === 'completed';
        
        return (
          <Card key={schedule.id} className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold truncate">{schedule.function_name}</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span>Status:</span>
                  <div className={cn(
                    "px-2 py-1 rounded-full text-xs flex items-center gap-1",
                    isRunning ? "bg-blue-500/20 text-blue-500" :
                    isSuccess ? "bg-success/20 text-success" :
                    "bg-destructive/20 text-destructive"
                  )}>
                    {isRunning ? (
                      <>
                        <Timer className="h-3 w-3" />
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
                {lastExecution?.error_details && (
                  <p className="text-destructive truncate">
                    Error: {lastExecution.error_details}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  );
}