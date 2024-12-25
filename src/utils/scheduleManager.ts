import { supabase } from "@/integrations/supabase/client";
import { determineScheduleFrequency } from "@/services/scheduleManager";
import { toast } from "@/hooks/use-toast";

export async function updateScheduleConfiguration(functionName: string) {
  console.log(`Updating schedule configuration for ${functionName}`);
  
  try {
    const frequency = await determineScheduleFrequency(functionName);
    
    // Update the schedule configuration
    const { error } = await supabase
      .from('schedules')
      .upsert({
        function_name: functionName,
        schedule_type: 'time_based',
        time_config: {
          type: 'match_dependent',
          matchDayIntervalMinutes: 2,
          nonMatchIntervalMinutes: 30
        },
        execution_config: {
          retry_count: 3,
          timeout_seconds: 30,
          retry_delay_seconds: 60,
          concurrent_execution: false,
          retry_backoff: 'linear',
          max_retry_delay: 3600
        },
        active_period_start: frequency.startTime,
        active_period_end: frequency.endTime,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'function_name'
      });

    if (error) throw error;

    console.log(`Schedule updated for ${functionName}:`, frequency);
    return frequency;
  } catch (error) {
    console.error(`Error updating schedule for ${functionName}:`, error);
    toast({
      title: "Schedule Update Error",
      description: `Failed to update schedule for ${functionName}`,
      variant: "destructive",
    });
    throw error;
  }
}