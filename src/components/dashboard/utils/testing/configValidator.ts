import { supabase } from "@/integrations/supabase/client";
import { AdvancedScheduleFormValues } from "../../types/scheduling";

export async function verifyScheduleConfig(
  functionName: string,
  scheduleType: "time_based" | "event_based"
): Promise<boolean> {
  console.log(`Verifying schedule config for ${functionName} (${scheduleType})`);
  
  try {
    const { data: schedule, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('function_name', functionName)
      .single();

    if (error) {
      console.error('Error verifying schedule config:', error);
      return false;
    }

    if (!schedule) {
      console.error('No schedule found for function:', functionName);
      return false;
    }

    if (schedule.schedule_type !== scheduleType) {
      console.error(`Schedule type mismatch. Expected: ${scheduleType}, Got: ${schedule.schedule_type}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in verifyScheduleConfig:', error);
    return false;
  }
}

export function validateScheduleConfig(config: AdvancedScheduleFormValues): boolean {
  console.log('Validating schedule config:', config);

  if (!config.schedule_type) {
    console.error('Missing schedule type');
    return false;
  }

  if (config.schedule_type === 'time_based' && !config.time_config) {
    console.error('Missing time configuration for time-based schedule');
    return false;
  }

  if (config.schedule_type === 'event_based' && !config.event_config) {
    console.error('Missing event configuration for event-based schedule');
    return false;
  }

  return true;
}