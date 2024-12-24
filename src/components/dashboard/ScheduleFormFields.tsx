import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TimeConfigFields } from "./TimeConfigFields";
import { ExecutionConfigFields } from "./ExecutionConfigFields";
import { EventConditionsFields } from "./EventConditionsFields";
import { UseFormReturn } from "react-hook-form";
import { AdvancedScheduleFormValues } from "./types/scheduling";
import { toast } from "@/hooks/use-toast";
import { validateTimeZone } from "@/utils/validation";

interface ScheduleFormFieldsProps {
  form: UseFormReturn<AdvancedScheduleFormValues>;
}

export function ScheduleFormFields({ form }: ScheduleFormFieldsProps) {
  console.log("Rendering ScheduleFormFields with values:", form.getValues());

  const handleScheduleTypeChange = (value: string) => {
    form.setValue("schedule_type", value as "time_based" | "event_based");
    
    // Reset relevant fields based on schedule type
    if (value === "time_based") {
      form.setValue("event_conditions", []);
    } else {
      form.setValue("time_config", { type: "daily", hour: 3 });
    }

    toast({
      title: "Schedule Type Changed",
      description: `Switched to ${value} scheduling`,
    });
  };

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="enabled"
        render={({ field }) => (
          <FormItem className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Enabled</FormLabel>
              <FormDescription className="text-sm">
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
          name="schedule_type"
          rules={{
            required: "Schedule type is required"
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Schedule Type</FormLabel>
              <Select
                onValueChange={handleScheduleTypeChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select schedule type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="time_based">Time Based</SelectItem>
                  <SelectItem value="event_based">Event Based</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timezone"
          rules={{
            required: "Timezone is required",
            validate: {
              validTimezone: (value) => 
                validateTimeZone(value) || "Invalid timezone format"
            }
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <FormControl>
                <Input {...field} placeholder="UTC" className="h-10" />
              </FormControl>
              <FormDescription className="text-xs">
                Enter timezone (e.g., 'America/New_York', 'Europe/London')
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {form.watch("schedule_type") === "time_based" && (
        <TimeConfigFields form={form} />
      )}

      {form.watch("schedule_type") === "event_based" && (
        <EventConditionsFields form={form} />
      )}

      <ExecutionConfigFields form={form} />
    </div>
  );
}