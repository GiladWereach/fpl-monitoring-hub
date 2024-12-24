import { 
  AdvancedScheduleFormValues, 
  ScheduleOverride, 
  ResolvedSchedule, 
  ScheduleResolution 
} from '../types/scheduling';
import { determineMatchStatus } from './matchStatusService';

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
  if (schedule.schedule_type === 'time_based') {
    return schedule.time_config.type === 'match_dependent' 
      ? await getMatchDependentInterval(schedule)
      : schedule.time_config.matchDayIntervalMinutes || 1440;
  }

  // Event-based schedules default to checking every 30 minutes
  return 30;
}

async function getMatchDependentInterval(
  schedule: AdvancedScheduleFormValues
): Promise<number> {
  const matchStatus = await determineMatchStatus();
  
  if (matchStatus.hasActiveMatches) {
    return schedule.time_config.matchDayIntervalMinutes || 2;
  }
  
  if (matchStatus.isMatchDay) {
    return schedule.time_config.nonMatchIntervalMinutes || 30;
  }
  
  return schedule.time_config.matchDayIntervalMinutes || 1440;
}

function getDefaultInterval(schedule: AdvancedScheduleFormValues): number {
  return schedule.time_config.matchDayIntervalMinutes || 1440;
}

function calculateNextExecution(intervalMinutes: number): Date {
  const next = new Date();
  next.setMinutes(next.getMinutes() + intervalMinutes);
  return next;
}