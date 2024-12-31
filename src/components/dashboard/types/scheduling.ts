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
  created_at: string;
  updated_at: string;
  last_execution_at: string | null;
  next_execution_at: string | null;
  timezone: string;
  event_conditions: EventCondition[];
  execution_window: ExecutionWindow;
  execution_config: ExecutionConfig;
  priority?: number;
}

export interface ExecutionLog {
  id: string;
  schedule_id: string;
  started_at: string;
  completed_at?: string;
  status: string;
  error_details?: string;
  execution_duration_ms?: number;
}

export interface TestResult {
  passed: boolean;
  message: string;
  details?: any;
}

export interface TestSuite {
  name: string;
  tests: Array<{
    name: string;
    run: () => Promise<TestResult>;
  }>;
}

export interface ScheduleOverride {
  enabled?: boolean;
  time_config?: Partial<TimeConfig>;
  execution_config?: Partial<ExecutionConfig>;
}

export interface ResolvedSchedule extends Schedule {
  overrides?: ScheduleOverride;
}

export interface ScheduleResolution {
  schedule: ResolvedSchedule;
  nextExecution: Date | null;
  error?: string;
}

export interface ScheduleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Helper function to convert database schedule to our Schedule type
export function convertScheduleData(data: any): Schedule {
  return {
    id: data.id,
    function_name: data.function_name,
    schedule_type: data.schedule_type,
    enabled: data.enabled,
    time_config: data.time_config as TimeConfig,
    event_config: data.event_config as { triggerType: string; offsetMinutes: number },
    created_at: data.created_at,
    updated_at: data.updated_at,
    last_execution_at: data.last_execution_at,
    next_execution_at: data.next_execution_at,
    timezone: data.timezone,
    event_conditions: data.event_conditions as EventCondition[],
    execution_window: data.execution_window as ExecutionWindow,
    execution_config: data.execution_config as ExecutionConfig,
    priority: data.priority
  };
}