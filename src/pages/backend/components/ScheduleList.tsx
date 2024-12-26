import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuickActionsMenu } from "./QuickActionsMenu";
import { useQuery } from "@tanstack/react-query";

export function ScheduleList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      console.log('Fetching schedules');
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          schedule_execution_logs (
            id,
            status,
            started_at,
            completed_at,
            error_details
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching schedules:', error);
        throw error;
      }

      return data;
    },
    refetchInterval: 30000
  });

  const toggleScheduleStatus = async (scheduleId: string, currentEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ enabled: !currentEnabled })
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Schedule ${!currentEnabled ? 'enabled' : 'disabled'} successfully`,
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
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "enabled" && schedule.enabled) ||
      (statusFilter === "disabled" && !schedule.enabled);
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
            <SelectItem value="enabled">Enabled</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
          {filteredSchedules?.map((schedule) => (
            <TableRow key={schedule.id}>
              <TableCell>{schedule.function_name}</TableCell>
              <TableCell>{schedule.schedule_type}</TableCell>
              <TableCell>
                {schedule.time_config?.type === 'interval' && 
                  `Every ${schedule.time_config.intervalMinutes} minutes`}
                {schedule.time_config?.type === 'daily' && 
                  `Daily at ${schedule.time_config.hour}:00`}
                {schedule.time_config?.type === 'match_dependent' &&
                  `Match day: ${schedule.time_config.matchDayIntervalMinutes}m, Other: ${schedule.time_config.nonMatchIntervalMinutes}m`}
              </TableCell>
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
                  status={schedule.enabled}
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