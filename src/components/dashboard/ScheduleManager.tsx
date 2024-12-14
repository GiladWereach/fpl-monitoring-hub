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
import { TimeConfigFields } from "./TimeConfigFields";
import { ExecutionHistory } from "./ExecutionHistory";
import { ScheduleFormFields } from "./ScheduleFormFields";
import { ScheduleFormValues } from "./types";

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

  const { data: schedule, isLoading, error } = useQuery({
    queryKey: ["schedule", functionName],
    queryFn: async () => {
      console.log(`Fetching schedule for function: ${functionName}`);
      try {
        const { data, error } = await supabase
          .from("schedules")
          .select("*")
          .eq("function_name", functionName);

        if (error) {
          console.error(`Error fetching schedule for ${functionName}:`, error);
          throw error;
        }

        return data && data.length > 0 ? data[0] : null;
      } catch (error) {
        console.error(`Failed to fetch schedule for ${functionName}:`, error);
        toast({
          title: "Error",
          description: "Failed to fetch schedule. Please try again later.",
          variant: "destructive",
        });
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

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
        description: "Failed to update schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="text-red-500">
        Failed to load schedule. Please refresh the page.
      </div>
    );
  }

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