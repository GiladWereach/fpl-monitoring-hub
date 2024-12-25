export type RetryBackoffStrategy = 'linear' | 'exponential' | 'fixed';

export type ExecutionConfig = {
  retry_count: number;
  timeout_seconds: number;
  retry_delay_seconds: number;
  concurrent_execution: boolean;
  retry_backoff: RetryBackoffStrategy;
  max_retry_delay: number;
  alert_on_failure?: boolean;
  alert_on_recovery?: boolean;
  failure_threshold?: number;
  auto_disable_after_failures?: boolean;
};

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

export type Schedule = {
  id: string;
  function_name: string;
  schedule_type: 'time_based' | 'event_based';
  enabled: boolean;
  priority: number;
  description?: string;
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
  execution_config: ExecutionConfig;
  execution_window?: ExecutionWindow;
  notification_config: NotificationConfig;
  timezone: string;
  last_execution_at?: string;
  next_execution_at?: string;
  last_failure_at?: string;
  success_rate: number;
  avg_duration_ms?: number;
  dependencies: string[];
  paused_until?: string;
  pause_reason?: string;
};
