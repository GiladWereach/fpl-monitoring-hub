export interface Schedule {
  id: string;
  function_name: string;
  schedule_type: 'time_based' | 'event_based';
  time_config?: {
    type: 'daily' | 'interval';
    hour?: number;
    intervalMinutes?: number;
  };
  event_config?: {
    type: string;
    conditions?: any[];
  };
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