import * as React from "react";
import { Button } from "@/components/ui/button";
import { FormLabel, FormDescription } from "@/components/ui/form";
import { Plus, Minus } from "lucide-react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { AdvancedScheduleFormValues } from "./types/scheduling";
import { COMMON_PATTERNS } from "./constants/condition-patterns";
import { ConditionField } from "./components/ConditionField";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">Event Conditions</h3>
        <div className="flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ field: "", operator: "eq", value: "" })}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Condition
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <FormLabel>Common Patterns</FormLabel>
        <ScrollArea className="w-full">
          <div className="flex flex-wrap gap-2 pb-4">
            {COMMON_PATTERNS.map((pattern, index) => (
              <Button
                key={index}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleAddPattern(pattern)}
                className="flex-shrink-0"
              >
                {pattern.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
        <FormDescription>
          Click to add pre-configured condition patterns
        </FormDescription>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1 w-full">
              <ConditionField form={form} index={index} field={field} />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              className="flex-shrink-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}