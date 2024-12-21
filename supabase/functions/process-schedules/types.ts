export interface Schedule {
  id: string;
  function_name: string;
  frequency_type: 'fixed_interval' | 'daily' | 'match_dependent';
  base_interval_minutes?: number;
  fixed_time?: string;
  match_day_interval_minutes?: number;
  non_match_interval_minutes?: number;
  consecutive_failures: number;
  status: string;
  group_id?: string;
}

export interface ExecutionContext {
  frequency_type: string;
  interval_minutes: number;
  has_active_matches: boolean;
  consecutive_failures: number;
}

export interface ProcessedSchedule {
  id: string;
  function: string;
  success: boolean;
  duration: number;
  nextExecution: Date;
  context: {
    frequency_type: string;
    interval_minutes: number;
    has_active_matches: boolean;
  };
}