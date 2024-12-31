import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { QuickActionsMenu } from "./QuickActionsMenu";
import { Schedule } from "@/components/dashboard/types/scheduling";

interface ScheduleTableProps {
  schedules: Schedule[];
  onStatusChange: (id: string, currentStatus: string) => Promise<void>;
}

export function ScheduleTable({ schedules, onStatusChange }: ScheduleTableProps) {
  const getStatusColor = (enabled: boolean) => {
    return enabled ? 'bg-green-500' : 'bg-yellow-500';
  };

  const formatTimeConfig = (schedule: Schedule) => {
    if (!schedule.time_config) return 'Not configured';
    
    switch (schedule.time_config.type) {
      case 'interval':
        return `Every ${schedule.time_config.intervalMinutes} minutes`;
      case 'daily':
        return `Daily at ${schedule.time_config.hour}:00`;
      case 'match_dependent':
        return `Match day: ${schedule.time_config.matchDayIntervalMinutes}m, Other: ${schedule.time_config.nonMatchIntervalMinutes}m`;
      default:
        return 'Unknown configuration';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Function</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Frequency</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Run</TableHead>
          <TableHead>Next Run</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {schedules.map((schedule) => (
          <TableRow key={schedule.id}>
            <TableCell>{schedule.function_name}</TableCell>
            <TableCell>{schedule.schedule_type}</TableCell>
            <TableCell>{formatTimeConfig(schedule)}</TableCell>
            <TableCell>
              <Badge className={getStatusColor(schedule.enabled)}>
                {schedule.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </TableCell>
            <TableCell>
              {schedule.last_execution_at ? 
                format(new Date(schedule.last_execution_at), "MMM d, HH:mm:ss") : 
                'Never'}
            </TableCell>
            <TableCell>
              {schedule.next_execution_at ? 
                format(new Date(schedule.next_execution_at), "MMM d, HH:mm:ss") : 
                'Not scheduled'}
            </TableCell>
            <TableCell>
              <QuickActionsMenu
                scheduleId={schedule.id}
                functionName={schedule.function_name}
                status={schedule.enabled ? 'active' : 'disabled'}
                onStatusChange={() => onStatusChange(schedule.id, schedule.enabled ? 'active' : 'disabled')}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}