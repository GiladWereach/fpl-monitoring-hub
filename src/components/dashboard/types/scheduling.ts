import { Json } from "@/integrations/supabase/types";

export type RetryBackoffStrategy = 'linear' | 'exponential' | 'fixed';

export interface TimeConfig {
  matchDayIntervalMinutes?: number;
  nonMatchIntervalMinutes?: number;
  hour?: number;
}

export interface ExecutionWindow {
  start_time: string;
  end_time: string;
  days_of_week?: number[];
}

export interface ExecutionConfig {
  retry_count: number;
  timeout_seconds: number;
  retry_delay_seconds: number;
  concurrent_execution: boolean;
  retry_backoff: RetryBackoffStrategy;
  max_retry_delay: number;
  alert_on_failure?: boolean;
  alert_on_recovery?: boolean;
  failure_threshold?: number;
  auto_disable_after_failures?: boolean;
}

export interface EventCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string | number | boolean;
}

export interface Schedule {
  id: string;
  function_name: string;
  schedule_type: 'time_based' | 'event_based' | 'match_dependent';
  enabled: boolean;
  time_config: TimeConfig;
  event_config: {
    triggerType: string;
    offsetMinutes: number;
  };
  execution_config: ExecutionConfig;
  created_at: string;
  updated_at: string;
  last_execution_at: string | null;
  next_execution_at: string | null;
  timezone: string;
  event_conditions: EventCondition[];
  execution_window: ExecutionWindow;
}

export interface AdvancedScheduleFormValues {
  function_name: string;
  enabled: boolean;
  schedule_type: 'time_based' | 'event_based' | 'match_dependent';
  timezone: string;
  priority: number;
  time_config: TimeConfig;
  event_config: {
    triggerType: string;
    offsetMinutes: number;
  };
  execution_config: ExecutionConfig;
  event_conditions: EventCondition[];
  execution_window?: ExecutionWindow;
}

export function isTimeConfig(config: any): config is TimeConfig {
  return config && typeof config === 'object' &&
    ('matchDayIntervalMinutes' in config || 'nonMatchIntervalMinutes' in config || 'hour' in config);
}