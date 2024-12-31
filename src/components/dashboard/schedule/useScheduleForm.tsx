import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AdvancedScheduleFormValues, ScheduleData, convertScheduleData } from "../types/scheduling";
import { logAPIError, updateAPIHealthMetrics } from "@/utils/api/errorHandling";
import { Json } from "@/integrations/supabase/types";

interface UseScheduleFormProps {
  functionName: string;
  onSuccess?: () => void;
}

export function useScheduleForm({ functionName, onSuccess }: UseScheduleFormProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const form = useForm<AdvancedScheduleFormValues>({
    defaultValues: {
      enabled: false,
      schedule_type: "time_based",
      timezone: "UTC",
      time_config: {
        type: "daily",
        hour: 3,
        matchDayIntervalMinutes: 2,
        nonMatchIntervalMinutes: 30
      },
      event_config: {
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
      event_conditions: [],
      execution_window: {
        start_time: '00:00',
        end_time: '23:59',
        days_of_week: [1, 2, 3, 4, 5]
      }
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

        return scheduleData ? convertScheduleData(scheduleData) : null;
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
        schedule_type: schedule.schedule_type,
        timezone: schedule.timezone ?? "UTC",
        time_config: schedule.time_config ?? {
          type: "daily",
          hour: 3,
          matchDayIntervalMinutes: 2,
          nonMatchIntervalMinutes: 30
        },
        event_config: schedule.event_config ?? {
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
        event_conditions: schedule.event_conditions ?? [],
        execution_window: schedule.execution_window ?? {
          start_time: '00:00',
          end_time: '23:59',
          days_of_week: [1, 2, 3, 4, 5]
        }
      });
    }
  }, [schedule, form, functionName]);

  const onSubmit = async (values: AdvancedScheduleFormValues) => {
    console.log("Submitting schedule form:", values);
    
    try {
      const scheduleData = {
        function_name: functionName,
        schedule_type: values.schedule_type,
        enabled: values.enabled,
        timezone: values.timezone,
        time_config: JSON.parse(JSON.stringify(values.time_config)) as Json,
        event_config: JSON.parse(JSON.stringify(values.event_config)) as Json,
        event_conditions: JSON.parse(JSON.stringify(values.event_conditions)) as Json,
        execution_config: JSON.parse(JSON.stringify(values.execution_config)) as Json,
        execution_window: JSON.parse(JSON.stringify(values.execution_window)) as Json
      };

      const { error } = await supabase
        .from('schedules')
        .upsert([scheduleData], {
          onConflict: 'function_name'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
      onSuccess?.();
    } catch (error) {
      console.error("Error saving schedule:", error);
      
      toast({
        title: "Error",
        description: "Failed to update schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  return { form, onSubmit };
}
