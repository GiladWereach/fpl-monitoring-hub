import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { QuickActionsMenu } from "./QuickActionsMenu";

interface Schedule {
  id: string;
  function_name: string;
  status: string;
  schedule_groups?: { name: string } | null;
  frequency_type: string;
  last_execution_at: string | null;
  next_execution_at: string | null;
}

interface ScheduleTableProps {
  schedules: Schedule[];
  onStatusChange: (id: string, currentStatus: string) => Promise<void>;
}

export function ScheduleTable({ schedules, onStatusChange }: ScheduleTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Group</TableHead>
          <TableHead>Function</TableHead>
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
            <TableCell>
              {schedule.schedule_groups?.name || 'Ungrouped'}
            </TableCell>
            <TableCell>{schedule.function_name}</TableCell>
            <TableCell>
              {schedule.frequency_type === 'fixed_interval' && 
                'Every X minutes'}
              {schedule.frequency_type === 'daily' && 
                'Daily at specific time'}
              {schedule.frequency_type === 'match_dependent' &&
                'Based on match schedule'}
            </TableCell>
            <TableCell>
              <Badge className={getStatusColor(schedule.status)}>
                {schedule.status}
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
                status={schedule.status}
                onStatusChange={() => onStatusChange(schedule.id, schedule.status)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}