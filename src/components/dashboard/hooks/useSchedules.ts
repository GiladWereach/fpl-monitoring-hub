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
        .select('*')
        .order('function_name');
      
      if (error) {
        console.error('Error fetching schedules:', error);
        throw error;
      }
      
      console.log('Fetched schedules:', data);
      return data.map(schedule => convertScheduleData(schedule)) as Schedule[];
    },
    refetchInterval: 10000
  });
}