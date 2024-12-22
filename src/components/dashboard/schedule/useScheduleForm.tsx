import React from 'react';
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AdvancedScheduleFormValues, TimeConfig, EventConfig, ExecutionConfig, EventCondition } from "../types/scheduling";
import { logAPIError, updateAPIHealthMetrics } from "@/utils/api/errorHandling";

interface UseScheduleFormProps {
  functionName: string;
  onSuccess?: () => void;
}

export function useScheduleForm({ functionName, onSuccess }: UseScheduleFormProps) {
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

  const { data: schedule } = useQuery({
    queryKey: ["schedule", functionName],
    queryFn: async () => {
      console.log(`Fetching schedule for function: ${functionName}`);
      const startTime = Date.now();
      
      try {
        // Get the most recent metrics for this endpoint
        const { data: metrics, error: metricsError } = await supabase
          .from("api_health_metrics")
          .select("*")
          .eq("endpoint", functionName)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (metricsError && metricsError.code !== 'PGRST116') {
          console.error("Error fetching metrics:", metricsError);
          throw metricsError;
        }

        // Get the schedule
        const { data: scheduleData, error: scheduleError } = await supabase
          .from("schedules")
          .select("*")
          .eq("function_name", functionName)
          .maybeSingle();

        if (scheduleError) {
          console.error("Error fetching schedule:", scheduleError);
          throw scheduleError;
        }

        const endTime = Date.now();
        await updateAPIHealthMetrics("fetch_schedule", true, endTime - startTime);

        return scheduleData;
      } catch (error) {
        console.error("Error in schedule fetch:", error);
        await logAPIError({
          type: "SERVER_ERROR",
          message: error.message,
          endpoint: "fetch_schedule",
          statusCode: error.status || 500,
          retryCount: 0,
          requestParams: { functionName }
        });
        await updateAPIHealthMetrics("fetch_schedule", false);
        throw error;
      }
    }
  });

  React.useEffect(() => {
    if (schedule) {
      console.log(`Setting form values for ${functionName}:`, schedule);
      form.reset({
        enabled: schedule.enabled ?? false,
        scheduleType: schedule.schedule_type ?? "time_based",
        timezone: schedule.timezone ?? "UTC",
        timeConfig: schedule.time_config as TimeConfig ?? {
          type: "interval",
          intervalMinutes: 5,
          hour: 0
        },
        eventConfig: schedule.event_config as EventConfig ?? {
          triggerType: "deadline",
          offsetMinutes: 0
        },
        execution_config: schedule.execution_config as ExecutionConfig ?? {
          retry_count: 3,
          timeout_seconds: 30,
          retry_delay_seconds: 60,
          concurrent_execution: false,
          retry_backoff: "linear",
          max_retry_delay: 3600
        },
        event_conditions: (schedule.event_conditions as EventCondition[]) ?? []
      });
    }
  }, [schedule, form, functionName]);

  const onSubmit = async (values: AdvancedScheduleFormValues) => {
    const startTime = Date.now();
    try {
      console.log(`Saving schedule for ${functionName}:`, values);
      const { error } = await supabase
        .from('schedules')
        .upsert({
          function_name: functionName,
          schedule_type: values.scheduleType,
          enabled: values.enabled,
          timezone: values.timezone,
          time_config: values.scheduleType === 'time_based' ? values.timeConfig : null,
          event_config: values.scheduleType === 'event_based' ? values.eventConfig : null,
          event_conditions: values.event_conditions,
          execution_config: values.execution_config
        }, {
          onConflict: 'function_name'
        });

      if (error) throw error;

      const endTime = Date.now();
      await updateAPIHealthMetrics("save_schedule", true, endTime - startTime);

      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
      onSuccess?.();
    } catch (error) {
      console.error("Error saving schedule:", error);
      await logAPIError({
        type: "SERVER_ERROR",
        message: error.message,
        endpoint: "save_schedule",
        statusCode: error.status || 500,
        retryCount: 0,
        requestParams: { functionName, values }
      });
      await updateAPIHealthMetrics("save_schedule", false);
      
      toast({
        title: "Error",
        description: "Failed to update schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  return { form, onSubmit };
}