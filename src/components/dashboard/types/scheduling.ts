export type RetryBackoffStrategy = 'linear' | 'exponential' | 'fixed';

export type NotificationConfig = {
  email?: string | null;
  webhook_url?: string | null;
  notify_on_failure: boolean;
  notify_on_success: boolean;
};

export type ExecutionWindow = {
  start_time?: string | null;
  end_time?: string | null;
  days_of_week?: number[] | null;
};

export type ResourceUsage = {
  cpu_time_ms?: number;
  memory_mb?: number;
  network_bytes?: number;
};

export type ScheduleGroup = {
  id: string;
  name: string;
  description?: string;
  priority: number;
  color?: string;
  created_at: string;
  updated_at: string;
};

export type TimeConfig = {
  type: 'daily' | 'match_dependent';
  hour?: number;
  matchDayIntervalMinutes?: number;
  nonMatchIntervalMinutes?: number;
};

export type EventConfig = {
  triggerType: 'deadline' | 'kickoff' | 'match_status';
  offsetMinutes: number;
};

export type ExecutionConfig = {
  retry_count: number;
  timeout_seconds: number;
  retry_delay_seconds: number;
  concurrent_execution: boolean;
  retry_backoff: RetryBackoffStrategy;
  max_retry_delay: number;
};

export type EventCondition = {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string;
};

export interface TestSuite {
  functionName: string;
  scheduleTypes: Array<"time_based" | "event_based">;
}

export interface TestResult {
  success: boolean;
  executionTime?: number;
  retryCount?: number;
  error?: string;
  functionName?: string;
  scheduleType?: string;
}

export interface AdvancedScheduleFormValues {
  enabled: boolean;
  scheduleType: 'time_based' | 'event_based';
  timezone: string;
  timeConfig: TimeConfig;
  eventConfig?: EventConfig;
  execution_config: ExecutionConfig;
  event_conditions: EventCondition[];
}

export interface ScheduleData {
  id: string;
  function_name: string;
  schedule_type: 'time_based' | 'event_based';
  enabled: boolean;
  time_config: TimeConfig | null;
  event_config: EventConfig | null;
  execution_config: ExecutionConfig;
  created_at: string;
  updated_at: string;
  last_execution_at: string | null;
  next_execution_at: string | null;
  timezone: string;
  event_conditions: EventCondition[];
  execution_window: ExecutionWindow | null;
}