import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ScheduleFilters } from "./ScheduleFilters";
import { ScheduleTable } from "./ScheduleTable";

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

  const filteredSchedules = schedules?.filter(schedule => {
    const matchesSearch = schedule.function_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || schedule.status === statusFilter;
    const matchesGroup = groupFilter === "all" || schedule.schedule_groups?.name === groupFilter;
    return matchesSearch && matchesStatus && matchesGroup;
  });

  if (isLoading) return null;

  const uniqueGroups = Array.from(new Set(schedules?.map(s => s.schedule_groups?.name)));

  return (
    <div className="space-y-4">
      <ScheduleFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        groupFilter={groupFilter}
        onGroupFilterChange={setGroupFilter}
        groups={uniqueGroups}
      />

      <ScheduleTable
        schedules={filteredSchedules || []}
        onStatusChange={toggleScheduleStatus}
      />
    </div>
  );
}