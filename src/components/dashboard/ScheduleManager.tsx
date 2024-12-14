import { useState } from "react";
import * as React from "react";
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
import { Switch } from "@/components/ui/switch";
import { Timer } from "lucide-react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { TimeConfigFields } from "./TimeConfigFields";
import { ExecutionHistory } from "./ExecutionHistory";
import { ScheduleFormValues, TimeConfig, EventConfig } from "./types";

interface ScheduleManagerProps {
  functionName: string;
  functionDisplayName: string;
}

export function ScheduleManager({ functionName, functionDisplayName }: ScheduleManagerProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<ScheduleFormValues>({
    defaultValues: {
      enabled: false,
      scheduleType: "time_based",
    },
  });

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

      return data && data.length > 0 ? data[0] : null;
    },
  });

  React.useEffect(() => {
    if (schedule) {
      console.log(`Setting form values for ${functionName}:`, schedule);
      const timeConfig = schedule.time_config as TimeConfig;
      const eventConfig = schedule.event_config as EventConfig;
      
      form.reset({
        enabled: schedule.enabled,
        scheduleType: schedule.schedule_type,
        timeConfig,
        eventConfig,
      });
    }
  }, [schedule, form, functionName]);

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
                        <SelectItem value="match_status">
                          Match Status
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <Button type="submit" className="w-full">
              Save Schedule
            </Button>
          </form>
        </Form>
        <ExecutionHistory functionName={functionName} />
      </DialogContent>
    </Dialog>
  );
}
