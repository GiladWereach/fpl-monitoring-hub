import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

export function ExecutionList() {
  const { toast } = useToast();
  const lastExecutionRef = useRef<string | null>(null);

  const { data: executions } = useQuery({
    queryKey: ['recent-executions'],
    queryFn: async () => {
      console.log('Fetching recent executions');
      const { data, error } = await supabase
        .from('schedule_execution_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching execution logs:', error);
        throw error;
      }

      return data;
    },
    refetchInterval: 30000
  });

  const { data: metrics } = useQuery({
    queryKey: ['api-metrics'],
    queryFn: async () => {
      console.log('Fetching API metrics');
      const { data, error } = await supabase
        .from('api_health_metrics')
        .select('*');

      if (error) {
        console.error('Error fetching API metrics:', error);
        throw error;
      }

      console.log('Fetched metrics:', data);
      return data;
    },
    refetchInterval: 30000
  });

  useEffect(() => {
    if (executions && executions.length > 0) {
      const latestExecution = executions[0];
      
      // Only show notification if this is a new execution
      if (lastExecutionRef.current !== latestExecution.id) {
        lastExecutionRef.current = latestExecution.id;
        
        if (latestExecution.status === 'completed') {
          toast({
            title: "Function Execution Successful",
            description: `${latestExecution.schedule_id} completed successfully`,
            variant: "default",
          });
        } else if (latestExecution.status === 'failed') {
          toast({
            title: "Function Execution Failed",
            description: latestExecution.error_details || "An error occurred during execution",
            variant: "destructive",
          });
        }
      }
    }
  }, [executions, toast]);

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
        {executions?.map((log) => (
          <TableRow key={log.id}>
            <TableCell>{log.schedule_id}</TableCell>
            <TableCell>
              {format(new Date(log.started_at), "MMM d, HH:mm:ss")}
            </TableCell>
            <TableCell>
              {log.execution_duration_ms ? 
                `${log.execution_duration_ms}ms` : 
                'In Progress...'}
            </TableCell>
            <TableCell>
              <Badge
                className={
                  log.status === 'completed' ? 'bg-green-500' :
                  log.status === 'failed' ? 'bg-red-500' :
                  'bg-yellow-500'
                }
              >
                {log.status}
              </Badge>
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