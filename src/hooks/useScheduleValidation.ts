import { useCallback } from "react";
import { AdvancedScheduleFormValues } from "@/components/dashboard/types/scheduling";
import { validateTimeZone, validateScheduleConflicts, validateExecutionWindow } from "@/utils/validation";

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export function useScheduleValidation() {
  const validateForm = useCallback(async (
    values: AdvancedScheduleFormValues,
    scheduleId?: string
  ): Promise<ValidationResult> => {
    console.log("Validating schedule form:", values);
    
    const errors: ValidationError[] = [];

    // Validate timezone
    if (!validateTimeZone(values.timezone)) {
      errors.push({
        field: "timezone",
        message: "Invalid timezone format"
      });
    }

    // Validate execution window if present
    if (values.execution_window) {
      const windowValidation = validateExecutionWindow(values.execution_window);
      if (!windowValidation.isValid) {
        errors.push({
          field: "execution_window",
          message: windowValidation.error || "Invalid execution window"
        });
      }
    }

    // Check for schedule conflicts
    const conflictValidation = await validateScheduleConflicts(values);
    if (!conflictValidation.isValid) {
      errors.push({
        field: "schedule",
        message: conflictValidation.error || "Schedule conflicts detected"
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  return { validateForm };
}