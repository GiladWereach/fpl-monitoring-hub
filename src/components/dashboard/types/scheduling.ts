import { Json } from "@/integrations/supabase/types";

export type RetryBackoffStrategy = 'linear' | 'exponential' | 'fixed';

export type TimeConfig = {
  type: 'daily' | 'match_dependent' | 'interval';
  hour?: number;
  matchDayIntervalMinutes?: number;
  nonMatchIntervalMinutes?: number;
  intervalMinutes?: number;
};

export function isTimeConfig(value: any): value is TimeConfig {
  return value && typeof value === 'object' && 'type' in value;
}

export interface EventCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string | number | boolean;
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

export interface ExecutionWindow {
  start_time: string;
  end_time: string;
  days_of_week?: number[];
}

export interface Schedule {
  id: string;
  function_name: string;
  schedule_type: 'time_based' | 'event_based' | 'match_dependent';
  enabled: boolean;
  timezone: string;
  time_config: TimeConfig;
  event_config: any;
  event_conditions: EventCondition[];
  execution_config: ExecutionConfig;
  execution_window: ExecutionWindow;
  created_at?: string;
  updated_at?: string;
  last_execution_at?: string | null;
  next_execution_at?: string | null;
  priority?: number;
}

export type AdvancedScheduleFormValues = Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'last_execution_at' | 'next_execution_at'>;

export interface ExecutionLog {
  id: string;
  schedule_id: string;
  started_at: string;
  completed_at?: string;
  status: string;
  error_details?: string;
  execution_duration_ms?: number;
  execution_context?: Json;
  schedules: Schedule;
  display_name?: string;
}

export interface TestResult {
  success: boolean;
  passed: boolean;
  message: string;
  executionTime?: number;
  retryCount?: number;
  functionName?: string;
  scheduleType?: string;
  error?: string;
}

export interface TestSuite {
  name: string;
  tests: Array<{
    name: string;
    run: () => Promise<TestResult>;
  }>;
  functionName?: string;
  scheduleTypes?: string[];
}

export interface ScheduleOverride {
  enabled?: boolean;
  start_time: Date;
  end_time: Date;
  interval?: number;
  time_config?: Partial<TimeConfig>;
  execution_config?: Partial<ExecutionConfig>;
}

export interface ResolvedSchedule extends Schedule {
  override?: ScheduleOverride;
  resolution?: ScheduleResolution;
}

export interface ScheduleResolution {
  source: string;
  resolvedInterval: number;
  nextExecutionTime: Date;
}

export interface ScheduleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export function toJson<T>(value: T): Json {
  return value as unknown as Json;
}

export function convertScheduleData(data: any): Schedule {
  return {
    id: data.id,
    function_name: data.function_name,
    schedule_type: data.schedule_type,
    enabled: data.enabled,
    timezone: data.timezone,
    time_config: data.time_config,
    event_config: data.event_config,
    event_conditions: data.event_conditions || [],
    execution_config: data.execution_config,
    execution_window: data.execution_window,
    created_at: data.created_at,
    updated_at: data.updated_at,
    last_execution_at: data.last_execution_at,
    next_execution_at: data.next_execution_at,
    priority: data.priority
  };
}