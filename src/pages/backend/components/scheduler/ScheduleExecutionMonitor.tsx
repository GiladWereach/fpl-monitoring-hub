import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ExecutionLogFilters } from "../execution/ExecutionLogFilters";
import { ExecutionLogSearch } from "../execution/ExecutionLogSearch";
import { ExecutionLogTable } from "../execution/ExecutionLogTable";
import { useState } from "react";

export function ScheduleExecutionMonitor() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  const { data: executions, isLoading } = useQuery({
    queryKey: ['recent-executions', statusFilter, dateRange],
    queryFn: async () => {
      console.log('Fetching recent executions');
      let query = supabase
        .from('schedule_execution_logs')
        .select(`
          *,
          schedules (
            function_name
          )
        `)
        .order('started_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (dateRange.from) {
        query = query.gte('started_at', dateRange.from.toISOString());
      }

      if (dateRange.to) {
        query = query.lte('started_at', dateRange.to.toISOString());
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.error('Error fetching execution logs:', error);
        throw error;
      }

      console.log('Fetched executions:', data);
      return data;
    },
    refetchInterval: 30000
  });

  const filteredExecutions = executions?.filter(execution =>
    execution.schedules?.function_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <Card className="p-6"><Skeleton className="h-[400px] w-full" /></Card>;
  }

  // Calculate execution statistics
  const stats = {
    total: filteredExecutions?.length || 0,
    successful: filteredExecutions?.filter(e => e.status === 'completed').length || 0,
    failed: filteredExecutions?.filter(e => e.status === 'failed').length || 0,
    running: filteredExecutions?.filter(e => e.status === 'running').length || 0,
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Schedule Executions</h2>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            {stats.successful} Successful
          </span>
          <span className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            {stats.failed} Failed
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            {stats.running} Running
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <ExecutionLogSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <ExecutionLogFilters
          status={statusFilter}
          onStatusChange={setStatusFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
        <ExecutionLogTable executions={filteredExecutions || []} />
      </div>
    </Card>
  );
}