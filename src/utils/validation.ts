import { supabase } from "@/integrations/supabase/client";
import { AdvancedScheduleFormValues, TimeConfig } from "@/components/dashboard/types/scheduling";

export const validateTimeZone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (e) {
    return false;
  }
};

export const validateScheduleConflicts = async (
  values: AdvancedScheduleFormValues,
  currentScheduleId?: string
): Promise<string | true> => {
  console.log("Validating schedule conflicts:", values);
  
  // Check for conflicts with existing schedules
  const { data: existingSchedules, error } = await supabase
    .from('schedules')
    .select('*')
    .neq('id', currentScheduleId)
    .eq('enabled', true);

  if (error) {
    console.error("Error checking schedule conflicts:", error);
    return "Failed to validate schedule conflicts";
  }

  // For time-based schedules
  if (values.schedule_type === 'time_based') {
    const conflictingSchedule = existingSchedules?.find(schedule => {
      const timeConfig = schedule.time_config as TimeConfig | null;
      return schedule.schedule_type === 'time_based' &&
             timeConfig?.type === values.time_config.type &&
             timeConfig?.hour === values.time_config.hour;
    });

    if (conflictingSchedule) {
      return `Schedule conflict with ${conflictingSchedule.function_name}`;
    }
  }

  return true;
};

export const validateExecutionWindow = (
  startTime: string,
  endTime: string,
  daysOfWeek: number[]
): string | true => {
  console.log("Validating execution window:", { startTime, endTime, daysOfWeek });

  // Validate time format
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return "Invalid time format. Use HH:MM (24-hour format)";
  }

  // Validate days of week
  const validDays = daysOfWeek.every(day => day >= 0 && day <= 6);
  if (!validDays) {
    return "Invalid days of week. Use 0-6 (Sunday-Saturday)";
  }

  // Compare start and end times
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  if (startMinutes >= endMinutes) {
    return "End time must be after start time";
  }

  return true;
};