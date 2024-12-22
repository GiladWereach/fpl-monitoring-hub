import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AdvancedScheduleFormValues } from "../types/scheduling";
import { logAPIError, updateAPIHealthMetrics } from "@/utils/api/errorHandling";

interface UseScheduleFormProps {
  functionName: string;
  onSuccess?: () => void;
}

interface ScheduleData {
  created_at: string;
  enabled: boolean;
  event_conditions: any;
  event_config: any;
  execution_config: any;
  function_name: string;
  id: string;
  next_execution_at: string;
  schedule_type: 'time_based' | 'event_based';
  time_config: any;
  timezone: string;
  updated_at: string;
}

export function useScheduleForm({ functionName, onSuccess }: UseScheduleFormProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const form = useForm<AdvancedScheduleFormValues>({
    defaultValues: {
      enabled: false,
      scheduleType: "time_based",
      timezone: "UTC",
      timeConfig: {
        type: "daily",
        hour: 3,
        matchDayIntervalMinutes: 2,
        nonMatchIntervalMinutes: 30
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

        return scheduleData as ScheduleData;
      } catch (error) {
        console.error("Error in schedule fetch:", error);
        
        await logAPIError({
          type: "SERVER_ERROR",
          message: error.message,
          endpoint: "fetch_schedule",
          statusCode: error.status || 500,
          retryCount: isRetrying ? 1 : 0,
          requestParams: { functionName }
        });

        await updateAPIHealthMetrics("fetch_schedule", false);

        if (!isRetrying) {
          setIsRetrying(true);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return useScheduleForm({ functionName, onSuccess }).form.getValues();
        }

        toast({
          title: "Error fetching schedule",
          description: "Failed to load schedule data. Please try again later.",
          variant: "destructive",
        });

        throw error;
      } finally {
        setIsRetrying(false);
      }
    },
    retry: 1,
    retryDelay: 1000
  });

  useEffect(() => {
    if (schedule) {
      console.log(`Setting form values for ${functionName}:`, schedule);
      form.reset({
        enabled: schedule.enabled ?? false,
        scheduleType: schedule.schedule_type ?? "time_based",
        timezone: schedule.timezone ?? "UTC",
        timeConfig: schedule.time_config ?? {
          type: "daily",
          hour: 3,
          matchDayIntervalMinutes: 2,
          nonMatchIntervalMinutes: 30
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