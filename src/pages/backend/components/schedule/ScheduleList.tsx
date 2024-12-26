import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ScheduleFilters } from "./ScheduleFilters";
import { ScheduleTable } from "./ScheduleTable";
import { Schedule, TimeConfig } from "@/types/scheduling";

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

      // Transform the data to match the Schedule type
      return data.map((schedule: any) => ({
        ...schedule,
        time_config: schedule.time_config as TimeConfig,
        enabled: schedule.enabled || false
      })) as Schedule[];
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

  if (isLoading) return null;

  const groups = [...new Set(schedules?.map(s => s.schedule_type) || [])];

  return (
    <div className="space-y-4">
      <ScheduleFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        groupFilter={groupFilter}
        onGroupFilterChange={setGroupFilter}
        groups={groups}
      />

      <ScheduleTable
        schedules={schedules || []}
        onStatusChange={toggleScheduleStatus}
      />
    </div>
  );
}