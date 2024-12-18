import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";
import { functions } from "@/components/dashboard/utils/functionConfigs";

export function ExecutionList() {
  const { toast } = useToast();
  const lastExecutionRef = useRef<string | null>(null);

  const { data: executions } = useQuery({
    queryKey: ['recent-executions'],
    queryFn: async () => {
      console.log('Fetching recent executions');
      const { data, error } = await supabase
        .from('schedule_execution_logs')
        .select(`
          *,
          schedules (
            function_name
          )
        `)
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching execution logs:', error);
        throw error;
      }

      // Map the function names to their display names
      return data?.map(execution => {
        const functionConfig = functions.find(f => f.function === execution.schedules?.function_name);
        return {
          ...execution,
          display_name: functionConfig?.name || execution.schedules?.function_name || 'Unknown Function'
        };
      });
    },
    refetchInterval: 30000
  });

  const { data: metrics } = useQuery({
    queryKey: ['api-metrics'],
    queryFn: async () => {
      console.log('Fetching API metrics');
      try {
        const { data, error } = await supabase
          .from('api_health_metrics')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching API metrics:', error);
          throw error;
        }

        console.log('Fetched metrics:', data);
        return data || [];
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        return [];
      }
    },
    refetchInterval: 30000
  });

  useEffect(() => {
    if (executions && executions.length > 0) {
      const latestExecution = executions[0];
      
      if (lastExecutionRef.current !== latestExecution.id) {
        lastExecutionRef.current = latestExecution.id;
        
        if (latestExecution.status === 'completed') {
          toast({
            title: "Function Execution Successful",
            description: `${latestExecution.display_name} completed successfully`,
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

  const formatExecutionTime = (ms: number | null): string => {
    if (!ms) return 'In Progress...';
    
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
    return `${(ms / 3600000).toFixed(2)}h`;
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
        {executions?.map((log) => (
          <TableRow key={log.id}>
            <TableCell>{log.display_name}</TableCell>
            <TableCell>
              {format(new Date(log.started_at), "MMM d, HH:mm:ss")}
            </TableCell>
            <TableCell>
              {formatExecutionTime(log.execution_duration_ms)}
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