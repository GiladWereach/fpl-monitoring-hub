import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { AdvancedScheduleFormValues } from "./types/scheduling";

interface TimeConfigFieldsProps {
  form: UseFormReturn<AdvancedScheduleFormValues>;
}

export function TimeConfigFields({ form }: TimeConfigFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="timeConfig.type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Time Schedule Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select time schedule type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="match_dependent">Match Dependent</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch("timeConfig.type") === "daily" && (
        <FormField
          control={form.control}
          name="timeConfig.hour"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hour (UTC)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormDescription>Hour in 24-hour format (UTC)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {form.watch("timeConfig.type") === "match_dependent" && (
        <>
          <FormField
            control={form.control}
            name="timeConfig.matchDayIntervalMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Match Day Interval (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Interval during active matches (default: 2)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="timeConfig.nonMatchIntervalMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Non-Match Interval (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Interval during live gameweek (default: 30)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </>
  );
}