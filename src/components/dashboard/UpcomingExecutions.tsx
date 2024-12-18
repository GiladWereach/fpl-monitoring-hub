import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Clock, AlertCircle, Calendar } from "lucide-react";
import { format, isAfter } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export function UpcomingExecutions() {
  const { data: schedules, error } = useQuery({
    queryKey: ['upcoming-executions'],
    queryFn: async () => {
      console.log('Fetching upcoming executions');
      try {
        // First fetch regular schedules
        const { data: regularSchedules, error: scheduleError } = await supabase
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

        if (scheduleError) {
          console.error('Error fetching schedules:', scheduleError);
          throw scheduleError;
        }

        console.log('Regular schedules fetched:', regularSchedules);

        // Then fetch function schedules
        const { data: functionSchedules, error: fsError } = await supabase
          .from('function_schedules')
          .select('*')
          .eq('status', 'active')
          .order('next_execution_at', { ascending: true });

        if (fsError) {
          console.error('Error fetching function schedules:', fsError);
          throw fsError;
        }

        console.log('Function schedules fetched:', functionSchedules);

        // Combine and normalize both types of schedules
        const allSchedules = [
          ...(regularSchedules || []),
          ...(functionSchedules || []).map(fs => ({
            id: fs.id,
            function_name: fs.function_name,
            next_execution_at: fs.next_execution_at,
            enabled: fs.status === 'active',
            schedule_type: 'time_based',
            time_config: {
              type: fs.frequency_type === 'fixed_interval' ? 'interval' : 'daily',
              intervalMinutes: fs.base_interval_minutes,
              hour: fs.fixed_time ? parseInt(fs.fixed_time.split(':')[0]) : null
            }
          }))
        ];

        // Sort by next execution time
        return allSchedules.sort((a, b) => {
          if (!a.next_execution_at) return 1;
          if (!b.next_execution_at) return -1;
          return new Date(a.next_execution_at).getTime() - new Date(b.next_execution_at).getTime();
        });
      } catch (error) {
        console.error('Error in queryFn:', error);
        toast({
          title: "Error fetching schedules",
          description: "Please try again later",
          variant: "destructive",
        });
        throw error;
      }
    },
    refetchInterval: 30000
  });

  if (error) {
    console.error('Query error:', error);
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>Error loading upcoming executions</p>
        </div>
      </Card>
    );
  }

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
    return 'Manual trigger';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Upcoming Executions</h2>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {!schedules?.length && (
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
                  <p className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Next run: {format(new Date(schedule.next_execution_at), "MMM d, yyyy HH:mm:ss")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}