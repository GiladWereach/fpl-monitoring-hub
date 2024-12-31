import { Button } from "@/components/ui/button";
import { Timer } from "lucide-react";
import { ScheduleDialog } from "./schedule/ScheduleDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { checkScheduleConflicts } from "@/utils/scheduleConflictDetector";
import { ScheduleData } from "./types/scheduling";

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
        .maybeSingle() as { data: ScheduleData | null; error: any };

      if (error) {
        console.error(`Error fetching schedule for ${function_name}:`, error);
        throw error;
      }
      
      // Check for conflicts if schedule exists and is enabled
      if (data && data.enabled && data.execution_window) {
        const conflicts = await checkScheduleConflicts(
          function_name,
          {
            startTime: new Date(data.execution_window.start_time),
            endTime: new Date(data.execution_window.end_time)
          },
          data.id
        );

        if (conflicts.hasConflict) {
          console.warn(`Schedule conflicts detected for ${function_name}:`, conflicts.conflictingSchedules);
        }
      }
      
      console.log(`Schedule data for ${function_name}:`, data);
      return data;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Check if this is a core data function
  const isCoreDataFunction = [
    'fetch-players',
    'fetch-player-details',
    'fetch-teams',
    'fetch-events'
  ].includes(function_name);

  // Check if this is a match-dependent function
  const isMatchDependentFunction = 
    function_name === 'fetch-live-gameweek' || 
    function_name === 'fetch-fixtures';

  if (isLoading) {
    return null;
  }

  return (
    <ScheduleDialog 
      function_name={function_name}
      functionDisplayName={functionDisplayName}
      currentSchedule={schedule}
      isCoreDataFunction={isCoreDataFunction}
      isMatchDependentFunction={isMatchDependentFunction}
    />
  );
}