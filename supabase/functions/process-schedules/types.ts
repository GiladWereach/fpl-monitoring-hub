export interface ExecutionContext {
  instance_id: string;
  schedule_type: string;
  interval: number;
}

export interface ProcessedSchedule {
  id: string;
  function: string;
  success: boolean;
  duration?: number;
  nextExecution?: Date | null;
  error?: string;
  context?: ExecutionContext;
}

export interface ScheduleConfig {
  id: string;
  function_name: string;
  schedule_type: 'time_based' | 'event_based';
  enabled: boolean;
  time_config?: {
    type: 'interval' | 'daily' | 'weekly' | 'monthly' | 'cron';
    intervalMinutes?: number;
    hour?: number;
    cronExpression?: string;
  };
  event_config?: {
    triggerType: string;
    offsetMinutes: number;
  };
  execution_config: {
    retry_count: number;
    timeout_seconds: number;
    retry_delay_seconds: number;
    concurrent_execution: boolean;
    retry_backoff: 'linear' | 'exponential' | 'fixed';
    max_retry_delay: number;
  };
}