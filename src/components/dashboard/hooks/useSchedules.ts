import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Schedule, convertScheduleData } from "../types/scheduling";

export function useSchedules() {
  return useQuery({
    queryKey: ['function-schedules'],
    queryFn: async () => {
      console.log('Fetching function schedules');
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          schedule_execution_logs (
            id,
            status,
            started_at,
            completed_at,
            error_details,
            execution_duration_ms
          )
        `)
        .order('function_name');
      
      if (error) {
        console.error('Error fetching schedules:', error);
        throw error;
      }
      
      console.log('Fetched schedules:', data);
      // Use the convertScheduleData helper to ensure proper type conversion
      return data.map(schedule => convertScheduleData(schedule)) as Schedule[];
    },
    refetchInterval: 10000
  });
}