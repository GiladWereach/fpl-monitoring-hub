export type RetryBackoffStrategy = 'linear' | 'exponential' | 'fixed';

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

export type ExecutionWindow = {
  start_time?: string;
  end_time?: string;
  days_of_week?: number[];
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

export type TestSuite = {
  functionName: string;
  scheduleTypes: Array<"time_based" | "event_based">;
};

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
  execution_window?: ExecutionWindow;
  event_conditions: EventCondition[];
  execution_config: ExecutionConfig;
}