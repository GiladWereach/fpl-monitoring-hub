import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Schedule, AdvancedScheduleFormValues, toJson } from "../types/scheduling";
import { toast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

interface UseScheduleFormProps {
  initialData?: Schedule;
  onSuccess?: () => void;
}

export function useScheduleForm({ initialData, onSuccess }: UseScheduleFormProps = {}) {
  const form = useForm<AdvancedScheduleFormValues>({
    defaultValues: initialData ? {
      function_name: initialData.function_name,
      schedule_type: initialData.schedule_type,
      enabled: initialData.enabled,
      timezone: initialData.timezone,
      time_config: initialData.time_config,
      event_config: initialData.event_config,
      event_conditions: initialData.event_conditions,
      execution_config: initialData.execution_config,
      execution_window: initialData.execution_window,
      priority: initialData.priority,
    } : {
      function_name: '',
      schedule_type: 'time_based',
      enabled: true,
      timezone: 'UTC',
      time_config: {
        matchDayIntervalMinutes: 2,
        nonMatchIntervalMinutes: 30,
        hour: 0
      },
      event_config: {
        triggerType: '',
        offsetMinutes: 0
      },
      event_conditions: [],
      execution_config: {
        retry_count: 3,
        timeout_seconds: 30,
        retry_delay_seconds: 60,
        concurrent_execution: false,
        retry_backoff: 'linear',
        max_retry_delay: 3600,
        alert_on_failure: true,
        alert_on_recovery: true,
        failure_threshold: 3,
        auto_disable_after_failures: true
      },
      execution_window: {
        start_time: '00:00',
        end_time: '23:59',
        days_of_week: [0,1,2,3,4,5,6]
      }
    }
  });

  const onSubmit = async (data: AdvancedScheduleFormValues) => {
    try {
      const scheduleData = {
        function_name: data.function_name,
        schedule_type: data.schedule_type,
        enabled: data.enabled,
        timezone: data.timezone,
        time_config: toJson(data.time_config),
        event_config: toJson(data.event_config),
        execution_config: toJson(data.execution_config),
        event_conditions: toJson(data.event_conditions),
        execution_window: toJson(data.execution_window)
      };

      const { error } = await supabase
        .from('schedules')
        .insert([scheduleData]);

      if (error) throw error;

      toast({
        title: "Schedule created successfully",
        description: `The schedule for ${data.function_name} has been created.`,
      });

      onSuccess?.();

    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: "Error saving schedule",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return {
    form,
    onSubmit
  };
}