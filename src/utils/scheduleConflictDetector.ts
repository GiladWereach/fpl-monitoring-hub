import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ScheduleData } from "@/components/dashboard/types/scheduling";

export interface ScheduleWindow {
  startTime: Date;
  endTime: Date;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingSchedules: string[];
}

export async function checkScheduleConflicts(
  functionName: string,
  proposedWindow: ScheduleWindow,
  excludeScheduleId?: string
): Promise<ConflictCheckResult> {
  console.log(`Checking conflicts for ${functionName}`, proposedWindow);

  try {
    const { data: existingSchedules, error } = await supabase
      .from('schedules')
      .select('id, function_name, time_config, execution_window')
      .neq('id', excludeScheduleId || '')
      .eq('enabled', true) as { data: ScheduleData[] | null; error: any };

    if (error) throw error;

    const conflicts = existingSchedules?.filter(schedule => {
      if (!schedule.execution_window) return false;

      const scheduleWindow = {
        startTime: new Date(schedule.execution_window.start_time),
        endTime: new Date(schedule.execution_window.end_time)
      };

      return (
        (proposedWindow.startTime <= scheduleWindow.endTime &&
          proposedWindow.endTime >= scheduleWindow.startTime) ||
        (scheduleWindow.startTime <= proposedWindow.endTime &&
          scheduleWindow.endTime >= proposedWindow.startTime)
      );
    }) || [];

    console.log(`Found ${conflicts.length} conflicts for ${functionName}`);

    return {
      hasConflict: conflicts.length > 0,
      conflictingSchedules: conflicts.map(s => s.function_name)
    };
  } catch (error) {
    console.error('Error checking schedule conflicts:', error);
    toast({
      title: "Error",
      description: "Failed to check schedule conflicts",
      variant: "destructive",
    });
    throw error;
  }
}