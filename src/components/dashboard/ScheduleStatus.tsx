import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "../ui/card";

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
    return <div>No schedules configured</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {schedules.map((schedule) => (
        <Card key={schedule.id} className="p-4">
          <h3 className="font-semibold">{schedule.function_name}</h3>
          <div className="text-sm text-muted-foreground mt-2">
            <p>Type: {schedule.schedule_type}</p>
            <p>Status: {schedule.enabled ? 'Enabled' : 'Disabled'}</p>
            <p>Last run: {schedule.last_execution_at ? new Date(schedule.last_execution_at).toLocaleString() : 'Never'}</p>
            <p>Next run: {schedule.next_execution_at ? new Date(schedule.next_execution_at).toLocaleString() : 'Not scheduled'}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}