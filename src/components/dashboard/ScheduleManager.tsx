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
import { Timer } from "lucide-react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { ExecutionHistory } from "./ExecutionHistory";
import { ScheduleFormFields } from "./ScheduleFormFields";
import { Form } from "@/components/ui/form";
import { AdvancedScheduleFormValues } from "./types/scheduling";

interface ScheduleManagerProps {
  functionName: string;
  functionDisplayName: string;
}

export function ScheduleManager({ functionName, functionDisplayName }: ScheduleManagerProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<AdvancedScheduleFormValues>({
    defaultValues: {
      enabled: false,
      scheduleType: "time_based",
      timezone: "UTC",
      timeConfig: {
        type: "interval",
        intervalMinutes: 5,
        hour: 0
      },
      eventConfig: {
        triggerType: "deadline",
        offsetMinutes: 0
      },
      execution_config: {
        retry_count: 3,
        timeout_seconds: 30,
        retry_delay_seconds: 60,
        concurrent_execution: false,
        retry_backoff: "linear",
        max_retry_delay: 3600
      },
      event_conditions: []
    },
  });

  const { data: schedule, isLoading } = useQuery({
    queryKey: ["schedule", functionName],
    queryFn: async () => {
      console.log(`Fetching schedule for function: ${functionName}`);
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("function_name", functionName)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  React.useEffect(() => {
    if (schedule) {
      console.log(`Setting form values for ${functionName}:`, schedule);
      form.reset({
        enabled: schedule.enabled ?? false,
        scheduleType: schedule.schedule_type ?? "time_based",
        timezone: schedule.timezone ?? "UTC",
        timeConfig: schedule.time_config ?? {
          type: "interval",
          intervalMinutes: 5,
          hour: 0
        },
        eventConfig: schedule.event_config ?? {
          triggerType: "deadline",
          offsetMinutes: 0
        },
        execution_config: schedule.execution_config ?? {
          retry_count: 3,
          timeout_seconds: 30,
          retry_delay_seconds: 60,
          concurrent_execution: false,
          retry_backoff: "linear",
          max_retry_delay: 3600
        },
        event_conditions: schedule.event_conditions ?? []
      });
    }
  }, [schedule, form, functionName]);

  const onSubmit = async (values: AdvancedScheduleFormValues) => {
    try {
      console.log(`Saving schedule for ${functionName}:`, values);
      const { error } = await supabase
        .from("schedules")
        .upsert({
          function_name: functionName,
          schedule_type: values.scheduleType,
          enabled: values.enabled,
          timezone: values.timezone,
          time_config: values.scheduleType === "time_based" ? values.timeConfig : null,
          event_config: values.scheduleType === "event_based" ? values.eventConfig : null,
          event_conditions: values.event_conditions,
          execution_config: values.execution_config
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
        description: "Failed to update schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Button size="sm" variant="outline" disabled>
        <Timer className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Timer className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Schedule {functionDisplayName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScheduleFormFields form={form} />
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