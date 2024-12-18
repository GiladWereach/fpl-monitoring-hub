import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TimeConfigFields } from "./TimeConfigFields";
import { ExecutionConfigFields } from "./ExecutionConfigFields";
import { EventConditionsFields } from "./EventConditionsFields";
import { UseFormReturn } from "react-hook-form";
import { AdvancedScheduleFormValues } from "./types/scheduling";

interface ScheduleFormFieldsProps {
  form: UseFormReturn<AdvancedScheduleFormValues>;
}

export function ScheduleFormFields({ form }: ScheduleFormFieldsProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="enabled"
        render={({ field }) => (
          <FormItem className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Enabled</FormLabel>
              <FormDescription>
                Enable or disable this schedule
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                className="mt-2 sm:mt-0"
              />
            </FormControl>
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="scheduleType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Schedule Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="time_based">Time Based</SelectItem>
                  <SelectItem value="event_based">Event Based</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <FormControl>
                <Input {...field} placeholder="UTC" />
              </FormControl>
              <FormDescription>
                Enter timezone (e.g., 'America/New_York', 'Europe/London')
              </FormDescription>
            </FormItem>
          )}
        />
      </div>

      {form.watch("scheduleType") === "time_based" && (
        <TimeConfigFields form={form} />
      )}

      {form.watch("scheduleType") === "event_based" && (
        <EventConditionsFields form={form} />
      )}

      <ExecutionConfigFields form={form} />
    </div>
  );
}