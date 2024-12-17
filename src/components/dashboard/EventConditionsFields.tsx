import * as React from "react";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus } from "lucide-react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { AdvancedScheduleFormValues } from "./types/scheduling";

interface EventConditionsFieldsProps {
  form: UseFormReturn<AdvancedScheduleFormValues>;
}

const AVAILABLE_FIELDS = {
  fixture: [
    { label: "Status", value: "status", description: "Match status (e.g., SCHEDULED, LIVE, FINISHED)" },
    { label: "Minutes Played", value: "minutes", description: "Minutes elapsed in the match" },
    { label: "Home Score", value: "team_h_score", description: "Home team score" },
    { label: "Away Score", value: "team_a_score", description: "Away team score" },
  ],
  event: [
    { label: "Finished", value: "finished", description: "Whether the gameweek is finished" },
    { label: "Data Checked", value: "data_checked", description: "Whether data has been verified" },
    { label: "Is Current", value: "is_current", description: "Whether this is the current gameweek" },
    { label: "Is Next", value: "is_next", description: "Whether this is the next gameweek" },
  ],
  player: [
    { label: "Minutes", value: "minutes", description: "Player's minutes played" },
    { label: "Form", value: "form", description: "Player's form rating" },
    { label: "Status", value: "status", description: "Player's availability status" },
    { label: "Chance of Playing", value: "chance_of_playing_next_round", description: "Probability of playing next game" },
  ]
};

const FIELD_VALUES = {
  status: ["SCHEDULED", "LIVE", "FINISHED", "POSTPONED", "CANCELLED"],
  finished: ["true", "false"],
  data_checked: ["true", "false"],
  is_current: ["true", "false"],
  is_next: ["true", "false"],
  form: ["0", "1", "2", "3", "4", "5"],
  chance_of_playing_next_round: ["0", "25", "50", "75", "100"]
};

const COMMON_PATTERNS = [
  {
    name: "Match Completion",
    conditions: [
      { field: "status", operator: "eq", value: "FINISHED" }
    ],
    description: "Triggers when a match ends"
  },
  {
    name: "Gameweek Start",
    conditions: [
      { field: "is_current", operator: "eq", value: "true" }
    ],
    description: "Triggers at the start of a new gameweek"
  },
  {
    name: "Data Verification",
    conditions: [
      { field: "finished", operator: "eq", value: "true" },
      { field: "data_checked", operator: "eq", value: "true" }
    ],
    description: "Triggers when gameweek data is verified"
  }
];

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
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Value</FormLabel>
                {FIELD_VALUES[fields[index].field as keyof typeof FIELD_VALUES] ? (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select value" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="_placeholder" disabled>Select value</SelectItem>
                      {FIELD_VALUES[fields[index].field as keyof typeof FIELD_VALUES].map((value) => (
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
                      {...field}
                    />
                  </FormControl>
                )}
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