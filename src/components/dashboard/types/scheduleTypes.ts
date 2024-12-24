export type ScheduleFrequencyType = 'fixed_interval' | 'daily' | 'match_dependent';

export type ScheduleCategory = 'core_data' | 'match_dependent' | 'system' | 'analytics';

export interface ScheduleConfig {
  category: ScheduleCategory;
  defaultFrequency: ScheduleFrequencyType;
  baseIntervalMinutes: number;
  matchDayIntervalMinutes?: number;
  nonMatchIntervalMinutes?: number;
  description: string;
}

export interface FunctionDefinition {
  name: string;
  function: string;
  group: string;
  scheduleConfig: ScheduleConfig;
}