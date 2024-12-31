import { supabase } from "@/integrations/supabase/client";
import { AdvancedScheduleFormValues, Schedule, TimeConfig } from "@/components/dashboard/types/scheduling";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateTimeZone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (e) {
    return false;
  }
}

export function validateScheduleConflicts(schedule: Schedule): Promise<boolean> {
  return new Promise(async (resolve) => {
    const { data: existingSchedules } = await supabase
      .from('schedules')
      .select('*')
      .eq('function_name', schedule.function_name);

    const hasConflicts = existingSchedules?.some(existing => 
      existing.id !== schedule.id && hasTimeOverlap(schedule, existing)
    );

    resolve(!hasConflicts);
  });
}

export function validateExecutionWindow(window: any): boolean {
  if (!window.start_time || !window.end_time) {
    return false;
  }

  const start = new Date(`1970-01-01T${window.start_time}`);
  const end = new Date(`1970-01-01T${window.end_time}`);

  return start < end;
}

function hasTimeOverlap(schedule1: Schedule, schedule2: Schedule): boolean {
  if (schedule1.schedule_type !== schedule2.schedule_type) {
    return false;
  }

  // For match dependent schedules, check interval overlap
  if (schedule1.schedule_type === 'match_dependent') {
    const config1 = schedule1.time_config as TimeConfig;
    const config2 = schedule2.time_config as TimeConfig;
    return Math.abs(
      (config1.matchDayIntervalMinutes || 0) - (config2.matchDayIntervalMinutes || 0)
    ) < 1;
  }

  return false;
}

export async function validateSchedule(schedule: AdvancedScheduleFormValues): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate timezone
  if (!validateTimeZone(schedule.timezone)) {
    errors.push('Invalid timezone configuration');
  }

  // Validate execution window
  if (schedule.execution_window && !validateExecutionWindow(schedule.execution_window)) {
    errors.push('Invalid execution window configuration');
  }

  // Check for schedule conflicts
  const hasConflicts = await validateScheduleConflicts(schedule as unknown as Schedule);
  if (hasConflicts) {
    warnings.push('Potential schedule conflicts detected');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}