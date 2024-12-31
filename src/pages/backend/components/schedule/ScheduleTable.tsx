import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Schedule } from "@/components/dashboard/types/scheduling";
import { QuickActionsMenu } from "../QuickActionsMenu";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export interface ScheduleTableProps {
  schedules: Schedule[];
  onStatusChange: (scheduleId: string, currentStatus: string) => Promise<void>;
}

export function ScheduleTable({ schedules, onStatusChange }: ScheduleTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Function</TableHead>
          <TableHead>Type</TableHead>
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
            <TableCell>
              <Badge className={schedule.enabled ? 'bg-green-500' : 'bg-yellow-500'}>
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
                status={schedule.enabled}
                onStatusChange={() => onStatusChange(schedule.id, schedule.enabled ? 'disabled' : 'enabled')}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}