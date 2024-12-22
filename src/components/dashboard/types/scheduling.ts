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
  retry_backoff: 'linear' | 'exponential' | 'fixed';
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
}

export interface ScheduleData extends AdvancedScheduleFormValues {
  id: string;
  function_name: string;
  created_at: string;
  updated_at: string;
  last_execution_at: string | null;
  next_execution_at: string | null;
}