import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { QuickActionsMenu } from "./QuickActionsMenu";

export function ScheduleList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['function-schedules'],
    queryFn: async () => {
      console.log('Fetching function schedules');
      const { data, error } = await supabase
        .from('function_schedules')
        .select(`
          *,
          schedule_groups (
            name,
            description
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

  const toggleScheduleStatus = async (scheduleId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      const { error } = await supabase
        .from('function_schedules')
        .update({ status: newStatus })
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Schedule ${newStatus === 'active' ? 'activated' : 'paused'} successfully`,
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

  const filteredSchedules = schedules?.filter(schedule => {
    const matchesSearch = schedule.function_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || schedule.status === statusFilter;
    const matchesGroup = groupFilter === "all" || schedule.schedule_groups?.name === groupFilter;
    return matchesSearch && matchesStatus && matchesGroup;
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
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {Array.from(new Set(schedules?.map(s => s.schedule_groups?.name))).map(group => (
              <SelectItem key={group} value={group || ""}>
                {group || "Ungrouped"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Group</TableHead>
            <TableHead>Function</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Run</TableHead>
            <TableHead>Next Run</TableHead>
            <TableHead>Success Rate</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSchedules?.map((schedule) => (
            <TableRow key={schedule.id}>
              <TableCell>
                {schedule.schedule_groups?.name || 'Ungrouped'}
              </TableCell>
              <TableCell>{schedule.function_name}</TableCell>
              <TableCell>
                {schedule.frequency_type === 'fixed_interval' && 
                  `Every ${schedule.base_interval_minutes} minutes`}
                {schedule.frequency_type === 'daily' && 
                  `Daily at ${schedule.fixed_time}`}
                {schedule.frequency_type === 'match_dependent' &&
                  `Match day: ${schedule.match_day_interval_minutes}m, Other: ${schedule.non_match_interval_minutes}m`}
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
                {/* Placeholder for success rate */}
                95%
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <QuickActionsMenu
                    scheduleId={schedule.id}
                    status={schedule.status}
                    onStatusChange={(newStatus) => toggleScheduleStatus(schedule.id, schedule.status)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}