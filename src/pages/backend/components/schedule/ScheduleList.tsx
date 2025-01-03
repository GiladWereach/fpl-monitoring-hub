import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ScheduleFilters } from "./ScheduleFilters";
import { ScheduleTable } from "./ScheduleTable";
import { Schedule, convertScheduleData } from "@/components/dashboard/types/scheduling";

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

      console.log('Raw schedule data:', data);
      return data.map(schedule => convertScheduleData(schedule)) as Schedule[];
    },
    refetchInterval: 30000
  });

  const toggleScheduleStatus = async (scheduleId: string, currentStatus: string) => {
    try {
      const newEnabled = currentStatus !== 'active';
      console.log(`Toggling schedule ${scheduleId} to ${newEnabled ? 'enabled' : 'disabled'}`);
      
      const { error } = await supabase
        .from('schedules')
        .update({ enabled: newEnabled })
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Schedule ${newEnabled ? 'enabled' : 'disabled'} successfully`,
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

  if (isLoading) return null;

  const filteredSchedules = schedules?.filter(schedule => {
    const matchesSearch = schedule.function_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "enabled" && schedule.enabled) ||
      (statusFilter === "disabled" && !schedule.enabled);
    const matchesGroup = groupFilter === "all" || schedule.schedule_type === groupFilter;
    return matchesSearch && matchesStatus && matchesGroup;
  });

  return (
    <div className="space-y-4">
      <ScheduleFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        groupFilter={groupFilter}
        onGroupFilterChange={setGroupFilter}
        groups={[...new Set(schedules?.map(s => s.schedule_type) || [])]}
      />

      <ScheduleTable
        schedules={filteredSchedules || []}
        onStatusChange={toggleScheduleStatus}
      />
    </div>
  );
}