import { Json } from "@/integrations/supabase/types";

export type RetryBackoffStrategy = 'linear' | 'exponential' | 'fixed';

export type TimeConfig = {
  type: 'daily' | 'match_dependent' | 'interval';
  hour?: number;
  matchDayIntervalMinutes?: number;
  nonMatchIntervalMinutes?: number;
  intervalMinutes?: number;
};

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

export interface Schedule {
  id: string;
  function_name: string;
  schedule_type: 'time_based' | 'event_based';
  enabled: boolean;
  time_config: TimeConfig;
  event_config: any;
  execution_config: ExecutionConfig;
  created_at: string;
  updated_at: string;
  last_execution_at: string | null;
  next_execution_at: string | null;
  timezone: string;
  event_conditions: EventCondition[];
  execution_window: ExecutionWindow;
  status: string;
  frequency_type: string;
  description?: string;
  priority?: number;
  schedule_execution_logs?: ExecutionLog[];
}

export interface ScheduleData extends Schedule {
  schedule_execution_logs?: ExecutionLog[];
}

export interface ExecutionLog {
  id: string;
  schedule_id: string;
  started_at: string;
  completed_at?: string;
  status: string;
  error_details?: string;
  execution_duration_ms?: number;
  schedules?: {
    function_name: string;
  };
}

export interface EventCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string | number | boolean;
}

export interface AdvancedScheduleFormValues {
  function_name: string;
  enabled: boolean;
  schedule_type: 'time_based' | 'event_based';
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

export interface ScheduleOverride {
  enabled: boolean;
  startTime: Date;
  endTime: Date;
  interval?: number;
}

export interface ScheduleResolution {
  priority: 'override' | 'default';
  source: 'override' | 'system';
  resolvedInterval: number;
  nextExecutionTime: Date;
}

export interface ResolvedSchedule {
  baseSchedule: AdvancedScheduleFormValues;
  override?: ScheduleOverride;
  resolution: ScheduleResolution;
}

export interface TestResult {
  success: boolean;
  executionTime?: number;
  error?: string;
  functionName: string;
  scheduleType?: string;
  retryCount?: number;
}

export interface TestSuite {
  functionName: string;
  scheduleTypes: ('time_based' | 'event_based')[];
}

export interface ScheduleValidationResult {
  isValid: boolean;
  errors: { field: string; message: string }[];
}

export function isTimeConfig(config: any): config is TimeConfig {
  return config && typeof config === 'object' && 
    ('type' in config) &&
    (config.type === 'daily' || config.type === 'match_dependent' || config.type === 'interval');
}

export function convertScheduleData(data: any): Schedule {
  return {
    ...data,
    time_config: data.time_config || {},
    event_config: data.event_config || {},
    execution_config: data.execution_config || {
      retry_count: 3,
      timeout_seconds: 30,
      retry_delay_seconds: 60,
      concurrent_execution: false,
      retry_backoff: 'linear',
      max_retry_delay: 3600
    },
    event_conditions: data.event_conditions || [],
    execution_window: data.execution_window || {
      start_time: '00:00',
      end_time: '23:59',
      days_of_week: [1, 2, 3, 4, 5]
    }
  };
}