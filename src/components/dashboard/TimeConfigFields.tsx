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
                <SelectItem value="interval">Interval</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="cron">Cron</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch("timeConfig.type") === "interval" && (
        <FormField
          control={form.control}
          name="timeConfig.intervalMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interval (minutes)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={5}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormDescription>Minimum 5 minutes interval</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {["daily", "weekly", "monthly"].includes(form.watch("timeConfig.type") || "") && (
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

      {form.watch("timeConfig.type") === "cron" && (
        <FormField
          control={form.control}
          name="timeConfig.cronExpression"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cron Expression</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>Standard cron expression format</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
}