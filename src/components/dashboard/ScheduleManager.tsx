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
  const { data: schedule } = useQuery({
    queryKey: ['schedule', functionName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('function_schedules')
        .select('*')
        .eq('function_name', functionName)
        .single();

      if (error) throw error;
      return data;
    }
  });

  // Auto-update schedule based on match timings
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

  return (
    <ScheduleDialog 
      functionName={functionName} 
      functionDisplayName={functionDisplayName}
      currentSchedule={schedule}
    />
  );
}