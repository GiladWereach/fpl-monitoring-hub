import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { ExecutionLogFilters } from "./execution/ExecutionLogFilters";
import { ExecutionLogSearch } from "./execution/ExecutionLogSearch";
import { ExecutionLogTable } from "./execution/ExecutionLogTable";
import { functions } from "@/components/dashboard/utils/functionConfigs";

export function ExecutionList() {
  const { toast } = useToast();
  const lastExecutionRef = useRef<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  const { data: executions } = useQuery({
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

  const filteredExecutions = executions?.filter(execution =>
    execution.schedules?.function_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="p-6">
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
    </Card>
  );
}