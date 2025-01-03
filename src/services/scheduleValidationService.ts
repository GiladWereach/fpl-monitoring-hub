import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AdvancedScheduleFormValues } from "@/components/dashboard/types/scheduling";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export async function validateSchedule(schedule: AdvancedScheduleFormValues): Promise<ValidationResult> {
  console.log('Validating schedule:', schedule);
  
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for schedule conflicts
  const conflicts = await checkScheduleConflicts(schedule);
  if (conflicts.length > 0) {
    errors.push(`Schedule conflicts with: ${conflicts.join(', ')}`);
  }

  // Validate execution windows
  if (schedule.execution_window) {
    const windowValid = validateExecutionWindow(schedule.execution_window);
    if (!windowValid) {
      errors.push('Invalid execution window configuration');
    }
  }

  // Validate event conditions
  if (schedule.event_conditions?.length > 0) {
    const conditionsValid = validateEventConditions(schedule.event_conditions);
    if (!conditionsValid) {
      errors.push('Invalid event conditions configuration');
    }
  }

  // Check execution config
  const execConfigValid = validateExecutionConfig(schedule.execution_config);
  if (!execConfigValid) {
    errors.push('Invalid execution configuration');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

async function checkScheduleConflicts(schedule: AdvancedScheduleFormValues): Promise<string[]> {
  console.log('Checking for schedule conflicts');
  
  const { data: existingSchedules, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('function_name', schedule.function_name);

  if (error) {
    console.error('Error checking schedule conflicts:', error);
    throw error;
  }

  return existingSchedules
    .filter(existing => hasTimeOverlap(schedule, existing))
    .map(s => s.function_name);
}

function hasTimeOverlap(schedule1: AdvancedScheduleFormValues, schedule2: any): boolean {
  // Implementation depends on your scheduling logic
  // This is a basic example
  if (schedule1.schedule_type !== schedule2.schedule_type) {
    return false;
  }

  // Check for daily schedule overlaps
  if (schedule1.schedule_type === 'time_based' && schedule1.time_config?.type === 'daily') {
    const hour1 = schedule1.time_config.hour;
    const hour2 = schedule2.time_config?.hour;
    return Math.abs(hour1 - hour2) < 1; // Consider 1 hour buffer
  }

  return false;
}

function validateExecutionWindow(window: any): boolean {
  if (!window.start_time || !window.end_time) {
    return false;
  }

  const start = new Date(`1970-01-01T${window.start_time}`);
  const end = new Date(`1970-01-01T${window.end_time}`);

  return start < end;
}

function validateEventConditions(conditions: any[]): boolean {
  return conditions.every(condition => 
    condition.field && 
    condition.operator && 
    condition.value !== undefined
  );
}

function validateExecutionConfig(config: any): boolean {
  return (
    config &&
    typeof config.retry_count === 'number' &&
    typeof config.timeout_seconds === 'number' &&
    typeof config.retry_delay_seconds === 'number'
  );
}