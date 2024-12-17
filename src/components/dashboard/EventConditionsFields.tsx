import * as React from "react";
import { Button } from "@/components/ui/button";
import { FormLabel, FormDescription } from "@/components/ui/form";
import { Plus, Minus } from "lucide-react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { AdvancedScheduleFormValues } from "./types/scheduling";
import { COMMON_PATTERNS } from "./constants/condition-patterns";
import { ConditionField } from "./components/ConditionField";

interface EventConditionsFieldsProps {
  form: UseFormReturn<AdvancedScheduleFormValues>;
}

export function EventConditionsFields({ form }: EventConditionsFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "event_conditions"
  });

  const handleAddPattern = (pattern: typeof COMMON_PATTERNS[0]) => {
    pattern.conditions.forEach(condition => {
      append(condition);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Event Conditions</h3>
        <div className="space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ field: "", operator: "eq", value: "" })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Condition
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <FormLabel>Common Patterns</FormLabel>
        <div className="flex flex-wrap gap-2">
          {COMMON_PATTERNS.map((pattern, index) => (
            <Button
              key={index}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleAddPattern(pattern)}
            >
              {pattern.name}
            </Button>
          ))}
        </div>
        <FormDescription>
          Click to add pre-configured condition patterns
        </FormDescription>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="flex items-end gap-2">
          <div className="flex-1">
            <ConditionField form={form} index={index} field={field} />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}