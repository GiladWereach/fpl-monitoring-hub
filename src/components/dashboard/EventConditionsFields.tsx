import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus } from "lucide-react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { AdvancedScheduleFormValues } from "./types/scheduling";

interface EventConditionsFieldsProps {
  form: UseFormReturn<AdvancedScheduleFormValues>;
}

export function EventConditionsFields({ form }: EventConditionsFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "event_conditions"
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Event Conditions</h3>
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

      {fields.map((field, index) => (
        <div key={field.id} className="flex items-end gap-2">
          <FormField
            control={form.control}
            name={`event_conditions.${index}.field`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Field</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="status" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`event_conditions.${index}.operator`}
            render={({ field }) => (
              <FormItem className="w-[120px]">
                <FormLabel>Operator</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="eq">=</SelectItem>
                    <SelectItem value="neq">≠</SelectItem>
                    <SelectItem value="gt">&gt;</SelectItem>
                    <SelectItem value="lt">&lt;</SelectItem>
                    <SelectItem value="gte">≥</SelectItem>
                    <SelectItem value="lte">≤</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`event_conditions.${index}.value`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Value</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />

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