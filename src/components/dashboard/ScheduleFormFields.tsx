import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeConfigFields } from "./TimeConfigFields";
import { UseFormReturn } from "react-hook-form";
import { ScheduleFormValues } from "./types";

interface ScheduleFormFieldsProps {
  form: UseFormReturn<ScheduleFormValues>;
}

export function ScheduleFormFields({ form }: ScheduleFormFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="enabled"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
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
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="scheduleType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Schedule Type</FormLabel>
            <Select
              onValueChange={field.onChange}
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
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      {form.watch("scheduleType") === "time_based" && (
        <TimeConfigFields form={form} />
      )}

      {form.watch("scheduleType") === "event_based" && (
        <FormField
          control={form.control}
          name="eventConfig.triggerType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Trigger Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="kickoff">Kickoff</SelectItem>
                  <SelectItem value="match_status">Match Status</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      )}
    </>
  );
}