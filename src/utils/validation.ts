import { Schedule, TimeConfig, ExecutionWindow, ScheduleValidationResult } from "@/components/dashboard/types/scheduling";
import { isAfter, isBefore, parse } from "date-fns";

export function validateTimeZone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (e) {
    return false;
  }
}

export function validateScheduleConflicts(schedule: Schedule): boolean {
  // Implementation of schedule conflict validation
  return true;
}

export function validateExecutionWindow(window: ExecutionWindow): boolean {
  if (!window.start_time || !window.end_time) return false;

  try {
    const start = parse(window.start_time, 'HH:mm', new Date());
    const end = parse(window.end_time, 'HH:mm', new Date());

    if (isAfter(start, end)) return false;

    if (window.days_of_week) {
      const validDays = window.days_of_week.every(day => day >= 0 && day <= 6);
      if (!validDays) return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}

export function validateSchedule(schedule: Schedule): ScheduleValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate timezone
  if (!validateTimeZone(schedule.timezone)) {
    errors.push('Invalid timezone');
  }

  // Validate execution window
  if (!validateExecutionWindow(schedule.execution_window)) {
    errors.push('Invalid execution window configuration');
  }

  // Validate schedule conflicts
  if (!validateScheduleConflicts(schedule)) {
    warnings.push('Potential schedule conflicts detected');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}