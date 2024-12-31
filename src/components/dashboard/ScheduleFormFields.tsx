import React from 'react';
import { useFormContext } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { TimeConfigFields } from "./TimeConfigFields";
import { EventConditionsFields } from "./EventConditionsFields";
import { ExecutionConfigFields } from "./ExecutionConfigFields";

export function ScheduleFormFields() {
  const form = useFormContext();

  const handleScheduleTypeChange = (value: string) => {
    if (value === "time_based") {
      form.setValue("time_config", {
        type: "interval",
        intervalMinutes: 1440
      });
      form.setValue("event_conditions", []);
    } else if (value === "match_dependent") {
      form.setValue("time_config", {
        type: "match_dependent",
        matchDayIntervalMinutes: 2,
        nonMatchIntervalMinutes: 30
      });
      form.setValue("event_conditions", []);
    } else if (value === "event_based") {
      form.setValue("time_config", {
        type: "interval",
        intervalMinutes: 5
      });
    }
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="schedule_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Schedule Type</FormLabel>
            <Select 
              onValueChange={(value) => {
                field.onChange(value);
                handleScheduleTypeChange(value);
              }} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select schedule type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="time_based">Time Based</SelectItem>
                <SelectItem value="event_based">Event Based</SelectItem>
                <SelectItem value="match_dependent">Match Dependent</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <TimeConfigFields />
      <EventConditionsFields />
      <ExecutionConfigFields />
    </div>
  );
}