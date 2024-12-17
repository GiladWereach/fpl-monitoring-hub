export interface Schedule {
  id: string;
  function_name: string;
  schedule_type: 'time_based' | 'event_based';
  enabled: boolean;
  time_config: {
    type: 'interval' | 'daily' | 'weekly' | 'monthly' | 'cron';
    intervalMinutes?: number;
    cronExpression?: string;
    hour?: number;
  } | null;
  event_config: {
    triggerType: string;
    offsetMinutes: number;
  } | null;
  last_execution_at: string | null;
  next_execution_at: string | null;
}