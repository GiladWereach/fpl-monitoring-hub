import { supabase } from "@/integrations/supabase/client";

export async function verifyScheduleConfig(functionName: string, scheduleType: string): Promise<boolean> {
  console.log(`Verifying schedule configuration for ${functionName}`);
  
  const { data: schedule, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('function_name', functionName)
    .single();

  if (error) {
    console.error(`Error verifying schedule config: ${error.message}`);
    return false;
  }

  return schedule.schedule_type === scheduleType && schedule.enabled;
}