import { Json } from "@/integrations/supabase/types";

export type RetryBackoffStrategy = 'linear' | 'exponential' | 'fixed';

export type TimeConfig = {
  type: 'daily' | 'match_dependent';
  hour?: number;
  matchDayIntervalMinutes?: number;
  nonMatchIntervalMinutes?: number;
};

export const isTimeConfig = (json: Json | null): json is TimeConfig => {
  if (!json || typeof json !== 'object') return false;
  const config = json as Record<string, unknown>;
  return (
    typeof config.type === 'string' &&
    ['daily', 'match_dependent'].includes(config.type)
  );
};

export type EventConfig = {
  triggerType: 'deadline' | 'realtime';
  offsetMinutes: number;
};

export type ExecutionConfig = {
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
};

export type EventCondition = {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string;
};

export type Schedule = {
  id: string;
  function_name: string;
  schedule_type: 'time_based' | 'event_based' | 'match_dependent';
  enabled: boolean;
  time_config?: TimeConfig | null;
  event_config?: EventConfig;
  execution_config: ExecutionConfig;
  execution_window?: {
    start_time: string;
    end_time: string;
    days_of_week?: number[];
  };
  timezone: string;
  event_conditions: EventCondition[];
  last_execution_at?: string;
  next_execution_at?: string;
  created_at?: string;
  updated_at?: string;
  schedule_execution_logs?: ExecutionLog[];
};

export type ExecutionLog = {
  id: string;
  schedule_id: string;
  started_at: string;
  completed_at?: string | null;
  status: string;
  error_details?: string | null;
  execution_duration_ms?: number | null;
  execution_context?: Json | null;
  created_at?: string | null;
  schedules?: {
    function_name: string;
  };
};

export type AdvancedScheduleFormValues = {
  function_name: string;
  enabled: boolean;
  schedule_type: 'time_based' | 'event_based' | 'match_dependent';
  timezone: string;
  time_config: TimeConfig;
  event_config: EventConfig;
  execution_config: ExecutionConfig;
  event_conditions: EventCondition[];
  execution_window?: {
    start_time: string;
    end_time: string;
    days_of_week?: number[];
  };
};

export type ScheduleData = Schedule;

export type ScheduleOverride = {
  id: string;
  enabled: boolean;
  startTime: Date;
  endTime: Date;
  interval?: number;
};

export type ScheduleResolution = {
  priority: 'override' | 'default';
  source: 'override' | 'system';
  resolvedInterval: number;
  nextExecutionTime: Date;
};

export type ResolvedSchedule = {
  baseSchedule: AdvancedScheduleFormValues;
  override?: ScheduleOverride;
  resolution: ScheduleResolution;
};

export type TestResult = {
  success: boolean;
  executionTime?: number;
  error?: string;
  functionName: string;
  scheduleType?: 'time_based' | 'event_based' | 'match_dependent' | 'retry-test';
  retryCount?: number;
};

export type TestSuite = {
  functionName: string;
  scheduleTypes: ('time_based' | 'event_based' | 'match_dependent')[];
};

export type ScheduleValidationResult = {
  isValid: boolean;
  errors: { field: string; message: string }[];
};

export const convertScheduleData = (data: any): Schedule => {
  return {
    id: data.id,
    function_name: data.function_name,
    schedule_type: data.schedule_type,
    enabled: data.enabled,
    time_config: isTimeConfig(data.time_config) ? data.time_config : null,
    event_config: data.event_config,
    execution_config: data.execution_config,
    execution_window: data.execution_window,
    timezone: data.timezone,
    event_conditions: data.event_conditions || [],
    last_execution_at: data.last_execution_at,
    next_execution_at: data.next_execution_at,
    created_at: data.created_at,
    updated_at: data.updated_at,
    schedule_execution_logs: data.schedule_execution_logs
  };
};