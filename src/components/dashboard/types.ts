export type TimeConfig = {
  type?: "interval" | "daily" | "weekly" | "monthly" | "cron";
  intervalMinutes?: number;
  cronExpression?: string;
  hour?: number;
};

export type EventConfig = {
  triggerType?: "deadline" | "kickoff" | "match_status";
  offsetMinutes?: number;
};

export interface ScheduleFormValues {
  enabled: boolean;
  scheduleType: "time_based" | "event_based";
  timeConfig?: TimeConfig;
  eventConfig?: EventConfig;
}