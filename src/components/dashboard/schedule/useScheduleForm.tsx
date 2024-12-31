import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Schedule, TimeConfig, ExecutionConfig, EventCondition, ExecutionWindow } from "../types/scheduling";
import { toast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

export interface AdvancedScheduleFormValues {
  function_name: string;
  schedule_type: 'time_based' | 'event_based' | 'match_dependent';
  enabled: boolean;
  timezone: string;
  time_config: TimeConfig;
  event_config: {
    triggerType: string;
    offsetMinutes: number;
  };
  event_conditions: EventCondition[];
  execution_config: ExecutionConfig;
  execution_window: ExecutionWindow;
}

export function useScheduleForm(initialData?: Schedule) {
  const form = useForm<AdvancedScheduleFormValues>({
    defaultValues: initialData ? {
      function_name: initialData.function_name,
      schedule_type: initialData.schedule_type,
      enabled: initialData.enabled,
      timezone: initialData.timezone,
      time_config: initialData.time_config as TimeConfig,
      event_config: initialData.event_config as { triggerType: string; offsetMinutes: number },
      event_conditions: initialData.event_conditions as EventCondition[],
      execution_config: initialData.execution_config as ExecutionConfig,
      execution_window: initialData.execution_window as ExecutionWindow,
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
        time_config: data.time_config as Json,
        event_config: data.event_config as Json,
        execution_config: data.execution_config as Json,
        event_conditions: data.event_conditions as Json,
        execution_window: data.execution_window as Json
      };

      const { error } = initialData 
        ? await supabase
            .from('schedules')
            .update(scheduleData)
            .eq('id', initialData.id)
        : await supabase
            .from('schedules')
            .insert([scheduleData]);

      if (error) throw error;

      toast({
        title: `Schedule ${initialData ? 'updated' : 'created'} successfully`,
        description: `The schedule for ${data.function_name} has been ${initialData ? 'updated' : 'created'}.`,
      });

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
    onSubmit: form.handleSubmit(onSubmit)
  };
}