import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { ExecutionLog } from "@/components/dashboard/types/scheduling";

interface ExecutionLogTableProps {
  executions: ExecutionLog[];
}

export function ExecutionLogTable({ executions }: ExecutionLogTableProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'running':
        return 'bg-blue-500';
      default:
        return 'bg-red-500';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Function</TableHead>
          <TableHead>Started At</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {executions.map((log) => (
          <TableRow key={log.id}>
            <TableCell>{log.schedules?.function_name || 'Unknown'}</TableCell>
            <TableCell>
              {format(new Date(log.started_at), "MMM d, HH:mm:ss")}
            </TableCell>
            <TableCell>
              {log.execution_duration_ms 
                ? `${(log.execution_duration_ms / 1000).toFixed(2)}s`
                : 'In Progress...'}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {getStatusIcon(log.status)}
                <Badge className={getStatusColor(log.status)}>
                  {log.status}
                </Badge>
              </div>
            </TableCell>
            <TableCell>
              {log.error_details || 'No errors'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}