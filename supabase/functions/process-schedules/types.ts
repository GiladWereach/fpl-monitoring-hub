export interface Schedule {
  id: string;
  function_name: string;
  schedule_type: 'time_based' | 'match_dependent' | 'daily';
  enabled: boolean;
  base_interval_minutes?: number;
  match_day_interval_minutes?: number;
  non_match_interval_minutes?: number;
  execution_config?: {
    timeout_seconds: number;
    retry_count: number;
    retry_delay_seconds: number;
    concurrent_execution: boolean;
    retry_backoff: 'linear' | 'exponential';
    max_retry_delay: number;
  };
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
    interval: number;
    [key: string]: any;
  };
}