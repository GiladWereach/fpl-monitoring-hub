import { Button } from "@/components/ui/button";
import { Timer } from "lucide-react";
import { ScheduleDialog } from "./schedule/ScheduleDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  // Check if this is a core data function
  const isCoreDataFunction = [
    'fetch-players',
    'fetch-player-details',
    'fetch-teams',
    'fetch-events'
  ].includes(functionName);

  // Check if this is a match-dependent function
  const isMatchDependentFunction = 
    functionName === 'fetch-live-gameweek' || 
    functionName === 'fetch-fixtures';

  if (isLoading) {
    return null;
  }

  return (
    <ScheduleDialog 
      functionName={functionName} 
      functionDisplayName={functionDisplayName}
      currentSchedule={schedule}
      isCoreDataFunction={isCoreDataFunction}
      isMatchDependentFunction={isMatchDependentFunction}
    />
  );
}