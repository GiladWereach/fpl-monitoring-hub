import { Json } from "@/integrations/supabase/types";

export type RetryBackoffStrategy = 'linear' | 'exponential' | 'fixed';

export type TimeConfig = {
  type: 'daily' | 'match_dependent' | 'interval';
  hour?: number;
  matchDayIntervalMinutes?: number;
  nonMatchIntervalMinutes?: number;
  intervalMinutes?: number;
};

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
  event_config?: any;
  execution_config: ExecutionConfig;
  created_at?: string;
  updated_at?: string;
  last_execution_at?: string | null;
  next_execution_at?: string | null;
  priority?: number;
  event_conditions?: EventCondition[];
  execution_window: ExecutionWindow;
}

export type AdvancedScheduleFormValues = Schedule;

export interface ExecutionLog {
  id: string;
  schedule_id: string;
  started_at: string;
  completed_at?: string;
  status: string;
  error_details?: string;
  execution_duration_ms?: number;
  execution_context?: Json;
  schedules: Partial<Schedule>;
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

export function isTimeConfig(value: any): value is TimeConfig {
  return value && 
         typeof value === 'object' && 
         'type' in value &&
         ['daily', 'match_dependent', 'interval'].includes(value.type);
}