import { AdvancedScheduleFormValues, ExecutionWindow, ScheduleValidationResult } from "@/components/dashboard/types/scheduling";

export function validateTimeZone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (e) {
    return false;
  }
}

interface WindowValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateExecutionWindow(window: ExecutionWindow): WindowValidationResult {
  const timeFormat = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  if (!timeFormat.test(window.start_time) || !timeFormat.test(window.end_time)) {
    return {
      isValid: false,
      error: "Invalid time format. Use HH:mm format (e.g., 09:00)"
    };
  }

  if (window.days_of_week) {
    const validDays = window.days_of_week.every(day => day >= 1 && day <= 7);
    if (!validDays) {
      return {
        isValid: false,
        error: "Days must be between 1 (Monday) and 7 (Sunday)"
      };
    }
  }

  return { isValid: true };
}

export async function validateScheduleConflicts(schedule: AdvancedScheduleFormValues): Promise<WindowValidationResult> {
  // Check for overlapping schedules with the same function
  if (schedule.schedule_type === 'time_based') {
    const existingSchedules = await fetchExistingSchedules(schedule.function_name);
    
    for (const existing of existingSchedules) {
      if (hasTimeOverlap(schedule, existing)) {
        return {
          isValid: false,
          error: `Schedule conflicts with existing schedule for ${existing.function_name}`
        };
      }
    }
  }

  // Check for resource constraints
  if (schedule.execution_config.concurrent_execution === false) {
    const concurrentSchedules = await checkConcurrentSchedules(schedule);
    if (concurrentSchedules.length > 0) {
      return {
        isValid: false,
        error: "Schedule may conflict with other non-concurrent schedules"
      };
    }
  }

  // Validate interval constraints
  if (schedule.time_config.type === 'interval') {
    if (schedule.time_config.intervalMinutes && schedule.time_config.intervalMinutes < 1) {
      return {
        isValid: false,
        error: "Interval must be at least 1 minute"
      };
    }
  }

  // Validate match day settings
  if (schedule.time_config.type === 'match_dependent') {
    if (!schedule.time_config.matchDayIntervalMinutes || !schedule.time_config.nonMatchIntervalMinutes) {
      return {
        isValid: false,
        error: "Match day and non-match day intervals are required"
      };
    }
    
    if (schedule.time_config.matchDayIntervalMinutes < 1 || schedule.time_config.nonMatchIntervalMinutes < 1) {
      return {
        isValid: false,
        error: "Intervals must be at least 1 minute"
      };
    }
  }

  return { isValid: true };
}

async function fetchExistingSchedules(functionName: string): Promise<AdvancedScheduleFormValues[]> {
  // This would typically fetch from your database
  // For now, return empty array as placeholder
  return [];
}

async function checkConcurrentSchedules(schedule: AdvancedScheduleFormValues): Promise<AdvancedScheduleFormValues[]> {
  // This would check for schedules that might run at the same time
  // For now, return empty array as placeholder
  return [];
}

function hasTimeOverlap(schedule1: AdvancedScheduleFormValues, schedule2: AdvancedScheduleFormValues): boolean {
  if (schedule1.time_config.type !== schedule2.time_config.type) {
    return false;
  }

  if (schedule1.time_config.type === 'daily') {
    return schedule1.time_config.hour === schedule2.time_config.hour;
  }

  if (schedule1.time_config.type === 'interval') {
    // Check if intervals might overlap
    const interval1 = schedule1.time_config.intervalMinutes || 0;
    const interval2 = schedule2.time_config.intervalMinutes || 0;
    return Math.min(interval1, interval2) <= Math.abs(interval1 - interval2);
  }

  if (schedule1.time_config.type === 'match_dependent') {
    return schedule1.time_config.matchDayIntervalMinutes === schedule2.time_config.matchDayIntervalMinutes &&
           schedule1.time_config.nonMatchIntervalMinutes === schedule2.time_config.nonMatchIntervalMinutes;
  }

  return false;
}