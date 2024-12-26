import { useQuery } from "@tanstack/react-query";
import { detectMatchWindow } from "@/services/matchWindowService";
import { supabase } from "@/integrations/supabase/client";
import { isTimeConfig } from "../types/scheduling";
import { toast } from "@/hooks/use-toast";

export function useMatchWindow(schedules: any[] | undefined, refetchSchedules: () => void) {
  return useQuery({
    queryKey: ['match-window'],
    queryFn: async () => {
      console.log('Detecting match window...');
      try {
        const window = await detectMatchWindow();
        console.log('Match window detected:', window);
        
        if (window && schedules) {
          console.log('Adjusting schedules based on match window:', window);
          const matchDependentSchedules = schedules.filter(s => 
            s.schedule_type === 'time_based' && 
            isTimeConfig(s.time_config) &&
            s.time_config.type === 'match_dependent'
          );

          for (const schedule of matchDependentSchedules) {
            if (!isTimeConfig(schedule.time_config)) continue;

            const intervalMinutes = window.is_active ? 
              schedule.time_config.matchDayIntervalMinutes : 
              schedule.time_config.nonMatchIntervalMinutes;

            if (intervalMinutes) {
              console.log(`Adjusting schedule ${schedule.function_name} to ${intervalMinutes} minute interval`);
              
              try {
                const nextExecution = new Date(Date.now() + intervalMinutes * 60 * 1000);
                await supabase
                  .from('schedules')
                  .update({ 
                    next_execution_at: nextExecution.toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', schedule.id);

                await supabase
                  .from('api_health_metrics')
                  .insert({
                    endpoint: `schedule_adjustment_${schedule.function_name}`,
                    success_count: 1,
                    error_count: 0,
                    avg_response_time: 0,
                    error_pattern: {
                      match_window: window.is_active ? 'active' : 'inactive',
                      interval: intervalMinutes
                    }
                  });
              } catch (error) {
                console.error(`Error adjusting schedule ${schedule.function_name}:`, error);
                await supabase
                  .from('api_health_metrics')
                  .insert({
                    endpoint: `schedule_adjustment_${schedule.function_name}`,
                    success_count: 0,
                    error_count: 1,
                    avg_response_time: 0,
                    error_pattern: {
                      error: error.message,
                      match_window: window.is_active ? 'active' : 'inactive'
                    }
                  });
              }
            }
          }
        }
        
        return window;
      } catch (error) {
        console.error('Error in match window detection:', error);
        toast({
          title: "Match Window Detection Error",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    refetchInterval: 60000
  });
}