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
import { functions } from "@/components/dashboard/utils/functionConfigs";

interface Schedule {
  id: string;
  function_name: string;
  schedule_type: 'time_based' | 'event_based';
  enabled: boolean;
  execution_config: {
    retry_count: number;
    retry_delay_seconds: number;
    concurrent_execution: boolean;
    retry_backoff: string;
    max_retry_delay: number;
  };
  time_config: {
    type: string;
    intervalMinutes?: number;
    hour?: number;
  } | null;
  event_config: {
    triggerType: string;
    offsetMinutes: number;
  } | null;
  last_execution_at: string | null;
  next_execution_at: string | null;
}

export function ScheduleList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      console.log('Fetching schedules');
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching schedules:', error);
        throw error;
      }

      return data as Schedule[];
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

  const getScheduleDescription = (schedule: Schedule) => {
    if (schedule.schedule_type === 'time_based' && schedule.time_config) {
      if (schedule.time_config.type === 'interval') {
        return `Every ${schedule.time_config.intervalMinutes} minutes`;
      }
      return `Daily at ${schedule.time_config.hour}:00`;
    }
    if (schedule.schedule_type === 'event_based' && schedule.event_config) {
      return `${schedule.event_config.triggerType} (${schedule.event_config.offsetMinutes} min offset)`;
    }
    return 'Not configured';
  };

  const getFunctionDisplayName = (functionName: string) => {
    const func = functions.find(f => f.function === functionName);
    return func ? func.name : functionName;
  };

  const filteredSchedules = schedules?.filter(schedule => {
    const matchesSearch = getFunctionDisplayName(schedule.function_name)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (schedule.enabled === (statusFilter === "active"));
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
            <TableHead>Schedule</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Run</TableHead>
            <TableHead>Next Run</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSchedules?.map((schedule) => (
            <TableRow key={schedule.id}>
              <TableCell>{getFunctionDisplayName(schedule.function_name)}</TableCell>
              <TableCell>{schedule.schedule_type}</TableCell>
              <TableCell>{getScheduleDescription(schedule)}</TableCell>
              <TableCell>
                <Badge variant={schedule.enabled ? "default" : "secondary"}>
                  {schedule.enabled ? 'Active' : 'Paused'}
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