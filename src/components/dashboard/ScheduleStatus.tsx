import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "../ui/card";
import { cn } from "@/lib/utils";

export function ScheduleStatus() {
  const { data: schedules } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('function_name');

      if (error) throw error;
      console.log('Current schedules:', data);
      return data;
    }
  });

  if (!schedules?.length) {
    return <div className="text-center p-4">No schedules configured</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {schedules.map((schedule) => (
        <Card key={schedule.id} className="p-4">
          <div className="space-y-2">
            <h3 className="font-semibold truncate">{schedule.function_name}</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>Status:</span>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs",
                  schedule.enabled ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                )}>
                  {schedule.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="truncate">
                Last run: {schedule.last_execution_at ? new Date(schedule.last_execution_at).toLocaleString() : 'Never'}
              </p>
              <p className="truncate">
                Next run: {schedule.next_execution_at ? new Date(schedule.next_execution_at).toLocaleString() : 'Not scheduled'}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}