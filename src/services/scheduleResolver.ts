import { 
  AdvancedScheduleFormValues, 
  ScheduleOverride, 
  ResolvedSchedule, 
  ScheduleResolution 
} from '../components/dashboard/types/scheduling';
import { determineMatchStatus } from './matchStatusService';

interface TimeConfig {
  type: 'daily' | 'match_dependent';
  matchDayIntervalMinutes?: number;
  nonMatchIntervalMinutes?: number;
  hour?: number;
}

export async function resolveSchedule(
  schedule: AdvancedScheduleFormValues,
  overrides: ScheduleOverride[] = []
): Promise<ResolvedSchedule> {
  console.log('Resolving schedule:', schedule);
  
  // Check for active overrides
  const activeOverride = overrides.find(override => {
    const now = new Date();
    return override.enabled && 
           now >= override.startTime && 
           now <= override.endTime;
  });

  if (activeOverride) {
    console.log('Found active override:', activeOverride);
    return resolveWithOverride(schedule, activeOverride);
  }

  // Default resolution based on schedule type
  return resolveDefault(schedule);
}

async function resolveWithOverride(
  schedule: AdvancedScheduleFormValues,
  override: ScheduleOverride
): Promise<ResolvedSchedule> {
  const resolution: ScheduleResolution = {
    priority: 'override',
    source: 'override',
    resolvedInterval: override.interval || getDefaultInterval(schedule),
    nextExecutionTime: calculateNextExecution(override.interval || getDefaultInterval(schedule))
  };

  return {
    baseSchedule: schedule,
    override,
    resolution
  };
}

async function resolveDefault(
  schedule: AdvancedScheduleFormValues
): Promise<ResolvedSchedule> {
  const interval = await calculateDynamicInterval(schedule);
  console.log(`Calculated interval for ${schedule.function_name}:`, interval);
  
  const resolution: ScheduleResolution = {
    priority: 'default',
    source: 'system',
    resolvedInterval: interval,
    nextExecutionTime: calculateNextExecution(interval)
  };

  return {
    baseSchedule: schedule,
    resolution
  };
}

async function calculateDynamicInterval(
  schedule: AdvancedScheduleFormValues
): Promise<number> {
  console.log('Calculating dynamic interval for schedule:', schedule);

  if (schedule.schedule_type === 'time_based' && 
      schedule.time_config.type === 'match_dependent') {
    return await getMatchDependentInterval(schedule);
  }

  // Default to schedule's configured interval or 30 minutes
  const timeConfig = schedule.time_config as TimeConfig;
  return timeConfig.matchDayIntervalMinutes || 30;
}

async function getMatchDependentInterval(
  schedule: AdvancedScheduleFormValues
): Promise<number> {
  console.log('Getting match dependent interval');
  const matchStatus = await determineMatchStatus();
  console.log('Match status:', matchStatus);
  
  const timeConfig = schedule.time_config as TimeConfig;
  
  if (matchStatus.hasActiveMatches) {
    console.log('Active matches found, using match day interval');
    return timeConfig.matchDayIntervalMinutes || 2;
  }
  
  if (matchStatus.isMatchDay) {
    console.log('Match day but no active matches, using non-match interval');
    return timeConfig.nonMatchIntervalMinutes || 30;
  }
  
  console.log('No matches, using default interval');
  return timeConfig.matchDayIntervalMinutes || 1440;
}

function getDefaultInterval(schedule: AdvancedScheduleFormValues): number {
  const timeConfig = schedule.time_config as TimeConfig;
  return timeConfig.matchDayIntervalMinutes || 1440;
}

function calculateNextExecution(intervalMinutes: number): Date {
  const next = new Date();
  next.setMinutes(next.getMinutes() + intervalMinutes);
  return next;
}