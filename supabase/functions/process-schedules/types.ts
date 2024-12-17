export interface Schedule {
  id: string;
  function_name: string;
  frequency_type: 'fixed_interval' | 'match_dependent' | 'daily';
  base_interval_minutes?: number;
  fixed_time?: string;
  match_day_interval_minutes?: number;
  non_match_interval_minutes?: number;
  max_concurrent_executions: number;
  timeout_seconds: number;
  retry_count: number;
  retry_delay_seconds: number;
  status: 'active' | 'paused' | 'error';
  last_execution_at: string | null;
  next_execution_at: string | null;
}

export interface ScheduleGroup {
  id: string;
  name: string;
  description: string | null;
}