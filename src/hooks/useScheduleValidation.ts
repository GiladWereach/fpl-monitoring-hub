import { useCallback } from "react";
import { AdvancedScheduleFormValues, ScheduleValidationResult } from "@/components/dashboard/types/scheduling";
import { validateTimeZone, validateScheduleConflicts, validateExecutionWindow } from "@/utils/validation";

export function useScheduleValidation() {
  const validateForm = useCallback(async (
    values: AdvancedScheduleFormValues,
    scheduleId?: string
  ): Promise<ScheduleValidationResult> => {
    console.log("Validating schedule form:", values);
    
    const errors: { field: string; message: string }[] = [];

    // Validate timezone
    if (!validateTimeZone(values.timezone)) {
      errors.push({
        field: "timezone",
        message: "Invalid timezone format"
      });
    }

    // Validate execution window if present
    if (values.execution_window) {
      const windowValidation = validateExecutionWindow(
        values.execution_window.start_time,
        values.execution_window.end_time,
        values.execution_window.days_of_week
      );

      if (windowValidation !== true) {
        errors.push({
          field: "execution_window",
          message: windowValidation
        });
      }
    }

    // Check for schedule conflicts
    const conflictValidation = await validateScheduleConflicts(values, scheduleId);
    if (conflictValidation !== true) {
      errors.push({
        field: "schedule",
        message: conflictValidation
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  return { validateForm };
}