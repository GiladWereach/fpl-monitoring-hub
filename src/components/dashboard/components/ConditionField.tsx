import * as React from "react";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
      <FormField
        control={form.control}
        name={`event_conditions.${index}.field`}
        render={({ field: fieldProps }) => (
          <FormItem className="flex-1 w-full sm:w-auto">
            <FormLabel>Field</FormLabel>
            <Select
              onValueChange={fieldProps.onChange}
              value={fieldProps.value}
            >
              <FormControl>
                <SelectTrigger className="h-10 sm:h-11">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="select_field" disabled>Select field</SelectItem>
                {Object.entries(AVAILABLE_FIELDS).map(([category, fields]) => (
                  <React.Fragment key={category}>
                    <SelectItem value={`header_${category}`} disabled>
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
          <FormItem className="w-full sm:w-[120px]">
            <FormLabel>Operator</FormLabel>
            <Select onValueChange={operatorField.onChange} value={operatorField.value}>
              <FormControl>
                <SelectTrigger className="h-10 sm:h-11">
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="select_operator" disabled>Select operator</SelectItem>
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
          <FormItem className="flex-1 w-full sm:w-auto">
            <FormLabel>Value</FormLabel>
            {FIELD_VALUES[field.field as keyof typeof FIELD_VALUES] ? (
              <Select onValueChange={valueField.onChange} value={valueField.value}>
                <FormControl>
                  <SelectTrigger className="h-10 sm:h-11">
                    <SelectValue placeholder="Select value" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="select_value" disabled>Select value</SelectItem>
                  {FIELD_VALUES[field.field as keyof typeof FIELD_VALUES].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <FormControl>
                <Input
                  className="h-10 sm:h-11"
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