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

export interface AdvancedScheduleFormValues {
  enabled: boolean;
  schedule_type: 'time_based' | 'event_based';
  timezone: string;
  time_config: TimeConfig;
  event_config: EventConfig;
  execution_config: ExecutionConfig;
  event_conditions: EventCondition[];
  execution_window?: {
    start_time: string;
    end_time: string;
    days_of_week: number[];
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ScheduleValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Add missing types
export interface ScheduleData {
  id?: string;
  function_name: string;
  schedule_type: 'time_based' | 'event_based';
  enabled: boolean;
  time_config?: TimeConfig;
  event_config?: EventConfig;
  execution_config: ExecutionConfig;
  timezone: string;
  event_conditions?: EventCondition[];
  execution_window?: {
    start_time: string;
    end_time: string;
    days_of_week: number[];
  };
}

export interface TestResult {
  success: boolean;
  executionTime?: number;
  error?: string;
  functionName?: string;
  scheduleType?: string;
  retryCount?: number;
}

export interface TestSuite {
  functionName: string;
  scheduleTypes: ('time_based' | 'event_based')[];
}

export const convertScheduleData = (data: any): ScheduleData => {
  return {
    id: data.id,
    function_name: data.function_name,
    schedule_type: data.schedule_type,
    enabled: data.enabled ?? true,
    time_config: data.time_config,
    event_config: data.event_config,
    execution_config: data.execution_config || {
      retry_count: 3,
      timeout_seconds: 30,
      retry_delay_seconds: 60,
      concurrent_execution: false,
      retry_backoff: 'linear',
      max_retry_delay: 3600
    },
    timezone: data.timezone || 'UTC',
    event_conditions: data.event_conditions || [],
    execution_window: data.execution_window
  };
};