import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Schedule } from "@/components/dashboard/types/scheduling";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ScheduleTableProps {
  schedules: Schedule[];
  onScheduleToggle: (scheduleId: string, enabled: boolean) => void;
}

export function ScheduleTable({ schedules, onScheduleToggle }: ScheduleTableProps) {
  const formatScheduleTime = (schedule: Schedule) => {
    if (schedule.schedule_type === 'match_dependent') {
      return `Match: ${schedule.time_config.matchDayIntervalMinutes}m, Other: ${schedule.time_config.nonMatchIntervalMinutes}m`;
    }
    return schedule.time_config.hour ? `Daily at ${schedule.time_config.hour}:00` : 'Custom';
  };

  const handleToggleSchedule = async (scheduleId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ enabled: !currentStatus })
        .eq('id', scheduleId);

      if (error) throw error;

      onScheduleToggle(scheduleId, !currentStatus);
      
      toast({
        title: "Schedule Updated",
        description: `Schedule ${!currentStatus ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling schedule:', error);
      toast({
        title: "Error",
        description: "Failed to update schedule status",
        variant: "destructive",
      });
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Function</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Schedule</TableHead>
          <TableHead>Last Run</TableHead>
          <TableHead>Next Run</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {schedules.map((schedule) => (
          <TableRow key={schedule.id}>
            <TableCell>{schedule.function_name}</TableCell>
            <TableCell>{schedule.schedule_type}</TableCell>
            <TableCell>{formatScheduleTime(schedule)}</TableCell>
            <TableCell>
              {schedule.last_execution_at
                ? format(new Date(schedule.last_execution_at), "MMM d, HH:mm:ss")
                : "Never"}
            </TableCell>
            <TableCell>
              {schedule.next_execution_at
                ? format(new Date(schedule.next_execution_at), "MMM d, HH:mm:ss")
                : "Not scheduled"}
            </TableCell>
            <TableCell>
              <Switch
                checked={schedule.enabled}
                onCheckedChange={() => handleToggleSchedule(schedule.id, schedule.enabled)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}