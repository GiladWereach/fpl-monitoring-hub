import * as React from "react";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { AdvancedScheduleFormValues, EventCondition } from "../types/scheduling";
import { AVAILABLE_FIELDS, FIELD_VALUES } from "../constants/condition-fields";

interface ConditionFieldProps {
  form: UseFormReturn<AdvancedScheduleFormValues>;
  index: number;
  field: EventCondition;
}

export function ConditionField({ form, index, field }: ConditionFieldProps) {
  return (
    <div className="flex items-end gap-2">
      <FormField
        control={form.control}
        name={`event_conditions.${index}.field`}
        render={({ field: fieldProps }) => (
          <FormItem className="flex-1">
            <FormLabel>Field</FormLabel>
            <Select
              onValueChange={fieldProps.onChange}
              value={fieldProps.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="_placeholder" disabled>Select field</SelectItem>
                {Object.entries(AVAILABLE_FIELDS).map(([category, fields]) => (
                  <React.Fragment key={category}>
                    <SelectItem value={`${category}_header`} disabled>
                      {category.toUpperCase()}
                    </SelectItem>
                    {fields.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`event_conditions.${index}.operator`}
        render={({ field: operatorField }) => (
          <FormItem className="w-[120px]">
            <FormLabel>Operator</FormLabel>
            <Select onValueChange={operatorField.onChange} value={operatorField.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="_placeholder" disabled>Select operator</SelectItem>
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
        render={({ field: valueField }) => (
          <FormItem className="flex-1">
            <FormLabel>Value</FormLabel>
            {FIELD_VALUES[field.field as keyof typeof FIELD_VALUES] ? (
              <Select onValueChange={valueField.onChange} value={valueField.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select value" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="_placeholder" disabled>Select value</SelectItem>
                  {FIELD_VALUES[field.field as keyof typeof FIELD_VALUES].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <FormControl>
                <input
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...valueField}
                />
              </FormControl>
            )}
          </FormItem>
        )}
      />
    </div>
  );
}