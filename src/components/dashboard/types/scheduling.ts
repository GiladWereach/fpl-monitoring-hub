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
  schedule_type: 'time_based' | 'event_based';
  timezone: string;
  time_config: TimeConfig;
  event_config: EventConfig;
  execution_config: ExecutionConfig;
  event_conditions: EventCondition[];
}

export interface ScheduleData extends AdvancedScheduleFormValues {
  id: string;
  function_name: string;
  created_at: string;
  updated_at: string;
  last_execution_at: string | null;
  next_execution_at: string | null;
  execution_window?: ExecutionWindow | null;
}

// Type guard to validate TimeConfig
export function isTimeConfig(obj: any): obj is TimeConfig {
  return obj && 
    typeof obj === 'object' && 
    (obj.type === 'daily' || obj.type === 'match_dependent');
}

// Type guard to validate EventConfig
export function isEventConfig(obj: any): obj is EventConfig {
  return obj && 
    typeof obj === 'object' && 
    typeof obj.triggerType === 'string' &&
    typeof obj.offsetMinutes === 'number';
}

// Type guard to validate ExecutionConfig
export function isExecutionConfig(obj: any): obj is ExecutionConfig {
  return obj && 
    typeof obj === 'object' &&
    typeof obj.retry_count === 'number' &&
    typeof obj.timeout_seconds === 'number' &&
    typeof obj.retry_delay_seconds === 'number' &&
    typeof obj.concurrent_execution === 'boolean' &&
    typeof obj.max_retry_delay === 'number' &&
    ['linear', 'exponential', 'fixed'].includes(obj.retry_backoff);
}

// Helper function to safely convert Supabase JSON to our types
export function convertScheduleData(data: any): ScheduleData {
  return {
    id: data.id,
    function_name: data.function_name,
    enabled: Boolean(data.enabled),
    schedule_type: data.schedule_type,
    timezone: data.timezone || 'UTC',
    time_config: isTimeConfig(data.time_config) ? data.time_config : {
      type: 'daily',
      hour: 3
    },
    event_config: isEventConfig(data.event_config) ? data.event_config : {
      triggerType: 'deadline',
      offsetMinutes: 0
    },
    execution_config: isExecutionConfig(data.execution_config) ? data.execution_config : {
      retry_count: 3,
      timeout_seconds: 30,
      retry_delay_seconds: 60,
      concurrent_execution: false,
      retry_backoff: 'linear',
      max_retry_delay: 3600
    },
    event_conditions: Array.isArray(data.event_conditions) ? data.event_conditions : [],
    created_at: data.created_at,
    updated_at: data.updated_at,
    last_execution_at: data.last_execution_at,
    next_execution_at: data.next_execution_at,
    execution_window: data.execution_window
  };
}