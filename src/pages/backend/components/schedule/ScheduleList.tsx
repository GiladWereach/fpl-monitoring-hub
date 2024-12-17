import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { QuickActionsMenu } from "./QuickActionsMenu";
import { toast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

interface ExecutionConfig {
  retry_count: number;
  retry_delay_seconds: number;
  priority?: number;
  concurrent_execution: boolean;
}

interface Schedule {
  id: string;
  function_name: string;
  schedule_type: 'time_based' | 'event_based';
  enabled: boolean;
  execution_config: ExecutionConfig;
  last_execution_at: string | null;
  next_execution_at: string | null;
  created_at: string;
  updated_at: string;
  timezone: string;
  event_conditions: Json;
  event_config: Json;
  execution_window: Json;
}

interface SupabaseSchedule {
  id: string;
  function_name: string;
  schedule_type: 'time_based' | 'event_based';
  enabled: boolean;
  execution_config: Json;
  last_execution_at: string | null;
  next_execution_at: string | null;
  created_at: string;
  updated_at: string;
  timezone: string;
  event_conditions: Json;
  event_config: Json;
  execution_window: Json;
}

export function ScheduleList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['function-schedules'],
    queryFn: async () => {
      console.log('Fetching function schedules');
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching schedules:', error);
        throw error;
      }

      // Convert the Supabase response to our Schedule type
      return (data as SupabaseSchedule[]).map(schedule => ({
        ...schedule,
        execution_config: schedule.execution_config as ExecutionConfig
      }));
    },
    refetchInterval: 30000
  });

  const toggleScheduleStatus = async (scheduleId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ enabled: !currentStatus })
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Schedule ${!currentStatus ? 'activated' : 'paused'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling schedule status:', error);
      toast({
        title: "Error",
        description: "Failed to update schedule status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled ? 'bg-green-500' : 'bg-yellow-500';
  };

  const filteredSchedules = schedules?.filter(schedule => {
    const matchesSearch = schedule.function_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || (schedule.enabled === (statusFilter === "active"));
    return matchesSearch && matchesStatus;
  });

  if (isLoading) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search functions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Function</TableHead>
            <TableHead>Schedule Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Last Run</TableHead>
            <TableHead>Next Run</TableHead>
            <TableHead>Success Rate</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSchedules?.map((schedule) => (
            <TableRow key={schedule.id}>
              <TableCell>{schedule.function_name}</TableCell>
              <TableCell>{schedule.schedule_type}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(schedule.enabled)}>
                  {schedule.enabled ? 'Active' : 'Paused'}
                </Badge>
              </TableCell>
              <TableCell>
                {schedule.execution_config.priority || 'Normal'}
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
                95%
              </TableCell>
              <TableCell>
                <QuickActionsMenu
                  scheduleId={schedule.id}
                  status={schedule.enabled ? 'active' : 'paused'}
                  onStatusChange={() => toggleScheduleStatus(schedule.id, schedule.enabled)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}