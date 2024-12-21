import { Button } from "@/components/ui/button";
import { Timer } from "lucide-react";
import { ScheduleDialog } from "./schedule/ScheduleDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { determineScheduleFrequency } from "@/utils/scheduleManager";
import { useEffect } from "react";

interface ScheduleManagerProps {
  functionName: string;
  functionDisplayName: string;
}

export function ScheduleManager({ functionName, functionDisplayName }: ScheduleManagerProps) {
  const { data: schedule, isLoading } = useQuery({
    queryKey: ['schedule', functionName],
    queryFn: async () => {
      console.log(`Fetching schedule for ${functionName}`);
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('function_name', functionName)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching schedule for ${functionName}:`, error);
        throw error;
      }
      
      console.log(`Schedule data for ${functionName}:`, data);
      return data;
    }
  });

  // Auto-update schedule based on match timings for specific functions
  useEffect(() => {
    if (functionName === 'fetch-live-gameweek' || functionName === 'fetch-fixtures') {
      const updateInterval = setInterval(async () => {
        try {
          await determineScheduleFrequency(functionName);
        } catch (error) {
          console.error(`Error updating schedule for ${functionName}:`, error);
        }
      }, 5 * 60 * 1000); // Check every 5 minutes

      return () => clearInterval(updateInterval);
    }
  }, [functionName]);

  // Check if this is a core data function
  const isCoreDataFunction = [
    'fetch-players',
    'fetch-player-details',
    'fetch-teams',
    'fetch-events'
  ].includes(functionName);

  if (isLoading) {
    return null;
  }

  return (
    <ScheduleDialog 
      functionName={functionName} 
      functionDisplayName={functionDisplayName}
      currentSchedule={schedule}
      isCoreDataFunction={isCoreDataFunction}
    />
  );
}