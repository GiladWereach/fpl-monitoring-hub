import { useCallback } from "react";
import { AdvancedScheduleFormValues, ScheduleValidationResult } from "@/components/dashboard/types/scheduling";
import { validateTimeZone, validateScheduleConflicts, validateExecutionWindow } from "@/utils/validation";

export function useScheduleValidation() {
  const validateForm = useCallback(async (
    values: AdvancedScheduleFormValues
  ): Promise<ScheduleValidationResult> => {
    console.log("Validating schedule form:", values);
    
    const errors: string[] = [];

    // Validate timezone
    if (!validateTimeZone(values.timezone)) {
      errors.push("Invalid timezone format");
    }

    // Validate execution window if present
    if (values.execution_window) {
      const windowValidation = validateExecutionWindow(values.execution_window);
      if (!windowValidation.isValid) {
        errors.push(windowValidation.error || "Invalid execution window");
      }
    }

    // Check for schedule conflicts
    const conflictValidation = await validateScheduleConflicts(values);
    if (!conflictValidation.isValid) {
      errors.push(conflictValidation.error || "Schedule conflicts detected");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  return { validateForm };
}