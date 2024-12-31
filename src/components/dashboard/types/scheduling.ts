import { Json } from "@/integrations/supabase/types";

export type RetryBackoffStrategy = 'linear' | 'exponential' | 'fixed';

export interface TimeConfig {
  matchDayIntervalMinutes?: number;
  nonMatchIntervalMinutes?: number;
  hour?: number;
  type?: 'daily' | 'match_dependent' | 'interval';
  intervalMinutes?: number;
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
  event_config: {
    triggerType: string;
    offsetMinutes: number;
  };
  event_conditions: EventCondition[];
  execution_config: ExecutionConfig;
  execution_window: ExecutionWindow;
  created_at?: string;
  updated_at?: string;
  last_execution_at?: string | null;
  next_execution_at?: string | null;
  priority?: number;
}

export type ScheduleData = Schedule;

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
  schedules?: Schedule;
}

export interface TestResult {
  passed: boolean;
  message: string;
  success?: boolean;
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
  priority?: 'override' | 'default';
}

export interface ScheduleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export function isTimeConfig(config: unknown): config is TimeConfig {
  if (!config || typeof config !== 'object') return false;
  const timeConfig = config as TimeConfig;
  return (
    typeof timeConfig.matchDayIntervalMinutes === 'number' ||
    typeof timeConfig.nonMatchIntervalMinutes === 'number' ||
    typeof timeConfig.hour === 'number' ||
    typeof timeConfig.type === 'string'
  );
}

export function toJson<T>(value: T): Json {
  return value as unknown as Json;
}