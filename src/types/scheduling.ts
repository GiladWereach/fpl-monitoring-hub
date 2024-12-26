export type RetryBackoffStrategy = 'linear' | 'exponential' | 'fixed';

export type TimeConfig = {
  type: 'daily' | 'match_dependent' | 'interval';
  hour?: number;
  matchDayIntervalMinutes?: number;
  nonMatchIntervalMinutes?: number;
  intervalMinutes?: number;
};

export interface Schedule {
  id: string;
  function_name: string;
  schedule_type: 'time_based' | 'event_based';
  enabled: boolean;
  time_config: TimeConfig;
  event_config: any;
  execution_config: any;
  created_at: string;
  updated_at: string;
  last_execution_at: string | null;
  next_execution_at: string | null;
  timezone: string;
  event_conditions: any[];
  execution_window: any;
  status: string;
  frequency_type: string;
  schedule_execution_logs?: any[];
}