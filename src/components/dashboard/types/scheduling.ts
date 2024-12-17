export type RetryBackoffStrategy = 'linear' | 'exponential' | 'fixed';

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
  value: string | number | boolean;
};

export interface AdvancedScheduleFormValues extends ScheduleFormValues {
  timezone: string;
  execution_window?: ExecutionWindow;
  event_conditions?: EventCondition[];
  execution_config: ExecutionConfig;
}