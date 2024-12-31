import React from 'react';
import { Button } from "@/components/ui/button";
import { Timer } from "lucide-react";
import { ScheduleDialog } from "./schedule/ScheduleDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Schedule } from "./types/scheduling";

interface ScheduleManagerProps {
  function_name: string;
  functionDisplayName: string;
}

export function ScheduleManager({ function_name, functionDisplayName }: ScheduleManagerProps) {
  const { data: schedule, isLoading } = useQuery({
    queryKey: ['schedule', function_name],
    queryFn: async () => {
      console.log(`Fetching schedule for ${function_name}`);
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
        .eq('function_name', function_name)
        .maybeSingle() as { data: Schedule | null; error: any };

      if (error) {
        console.error(`Error fetching schedule for ${function_name}:`, error);
        throw error;
      }
      
      console.log(`Schedule data for ${function_name}:`, data);
      return data;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return null;
  }

  return (
    <ScheduleDialog 
      function_name={function_name}
      functionDisplayName={functionDisplayName}
      currentSchedule={schedule}
      isCoreDataFunction={[
        'fetch-players',
        'fetch-player-details',
        'fetch-teams',
        'fetch-events'
      ].includes(function_name)}
      isMatchDependentFunction={
        function_name === 'fetch-live-gameweek' || 
        function_name === 'fetch-fixtures'
      }
    />
  );
}