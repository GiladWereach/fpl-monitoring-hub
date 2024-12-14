import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
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
import { Switch } from "@/components/ui/switch";
import { Timer } from "lucide-react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface ScheduleManagerProps {
  functionName: string;
  functionDisplayName: string;
}

interface ScheduleFormValues {
  enabled: boolean;
  scheduleType: "time_based" | "event_based";
  timeConfig?: {
    type: "interval" | "daily" | "weekly" | "monthly" | "cron";
    intervalMinutes?: number;
    cronExpression?: string;
  };
  eventConfig?: {
    triggerType: "deadline" | "kickoff" | "match_status";
    offsetMinutes: number;
  };
}

export function ScheduleManager({ functionName, functionDisplayName }: ScheduleManagerProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<ScheduleFormValues>();

  const { data: schedule, isLoading } = useQuery({
    queryKey: ["schedule", functionName],
    queryFn: async () => {
      console.log(`Fetching schedule for function: ${functionName}`);
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("function_name", functionName);

      if (error) {
        console.error(`Error fetching schedule for ${functionName}:`, error);
        throw error;
      }

      // Return the first schedule or null if none exists
      return data && data.length > 0 ? data[0] : null;
    },
  });

  // Set form values when schedule data is loaded
  React.useEffect(() => {
    if (schedule) {
      console.log(`Setting form values for ${functionName}:`, schedule);
      form.reset({
        enabled: schedule.enabled,
        scheduleType: schedule.schedule_type,
        timeConfig: schedule.time_config,
        eventConfig: schedule.event_config,
      });
    }
  }, [schedule, form]);

  const onSubmit = async (values: ScheduleFormValues) => {
    try {
      console.log(`Saving schedule for ${functionName}:`, values);
      const { error } = await supabase
        .from("schedules")
        .upsert({
          function_name: functionName,
          schedule_type: values.scheduleType,
          enabled: values.enabled,
          time_config: values.scheduleType === "time_based" ? values.timeConfig : null,
          event_config: values.scheduleType === "event_based" ? values.eventConfig : null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
      setOpen(false);
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Timer className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule {functionDisplayName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch("scheduleType") === "time_based" && (
              <>
                <FormField
                  control={form.control}
                  name="timeConfig.type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Schedule Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum 5 minutes interval
                        </FormDescription>
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
                        <FormDescription>
                          Standard cron expression format
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}
            {form.watch("scheduleType") === "event_based" && (
              <>
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
                          <SelectItem value="match_status">
                            Match Status
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="eventConfig.offsetMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Offset (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Minutes before/after the event (negative for before)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <Button type="submit" className="w-full">
              Save Schedule
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}