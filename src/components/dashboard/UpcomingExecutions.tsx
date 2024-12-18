import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Clock, AlertCircle } from "lucide-react";
import { format, isAfter } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function UpcomingExecutions() {
  const { data: schedules } = useQuery({
    queryKey: ['upcoming-executions'],
    queryFn: async () => {
      console.log('Fetching upcoming executions');
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          id,
          function_name,
          next_execution_at,
          enabled,
          schedule_type,
          time_config,
          event_config
        `)
        .order('next_execution_at', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching upcoming executions:', error);
        throw error;
      }

      return data;
    },
    refetchInterval: 30000
  });

  const getStatusBadge = (schedule: any) => {
    if (!schedule.enabled) {
      return <Badge variant="secondary">Disabled</Badge>;
    }
    
    if (!schedule.next_execution_at) {
      return <Badge variant="destructive">Not Scheduled</Badge>;
    }

    const nextExecution = new Date(schedule.next_execution_at);
    const isOverdue = isAfter(new Date(), nextExecution);

    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    }

    return <Badge variant="default">Scheduled</Badge>;
  };

  const getExecutionDetails = (schedule: any) => {
    if (schedule.schedule_type === 'time_based' && schedule.time_config) {
      if (schedule.time_config.type === 'interval') {
        return `Every ${schedule.time_config.intervalMinutes} minutes`;
      }
      if (schedule.time_config.type === 'daily') {
        return `Daily at ${schedule.time_config.hour}:00`;
      }
      return schedule.time_config.type;
    }
    if (schedule.schedule_type === 'event_based' && schedule.event_config) {
      return `On ${schedule.event_config.triggerType}`;
    }
    return 'Custom schedule';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Upcoming Executions</h2>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {schedules?.length === 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>No upcoming executions scheduled</span>
            </div>
          )}

          {schedules?.map((schedule) => (
            <div
              key={schedule.id}
              className="p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{schedule.function_name}</h3>
                {getStatusBadge(schedule)}
              </div>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{getExecutionDetails(schedule)}</p>
                {schedule.next_execution_at && (
                  <p>Next run: {format(new Date(schedule.next_execution_at), "MMM d, yyyy HH:mm:ss")}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}