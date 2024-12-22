export interface Schedule {
  id: string;
  function_name: string;
  frequency_type: 'daily' | 'match_dependent';
  fixed_time?: string;
  match_day_interval_minutes?: number;
  non_match_interval_minutes?: number;
  execution_config?: {
    retry_count: number;
    timeout_seconds: number;
    retry_delay_seconds: number;
    concurrent_execution: boolean;
    retry_backoff: 'linear' | 'exponential';
    max_retry_delay: number;
  };
  consecutive_failures: number;
  last_execution_at?: string;
  next_execution_at?: string;
}

export interface ProcessedSchedule {
  id: string;
  function: string;
  success: boolean;
  duration: number;
  nextExecution: Date | null;
  context: {
    schedule_type: string;
    time_config?: any;
    execution_config?: any;
  };
}

export interface ExecutionContext {
  schedule_type: string;
  time_config?: any;
  execution_config?: any;
}