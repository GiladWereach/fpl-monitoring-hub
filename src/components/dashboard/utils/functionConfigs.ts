import { FunctionDefinition, ScheduleCategory } from "../types/scheduleTypes";

export const functions: FunctionDefinition[] = [
  { 
    name: "Fetch Teams", 
    function: "fetch-teams", 
    group: "data-sync",
    scheduleConfig: {
      category: "core_data",
      defaultFrequency: "daily",
      baseIntervalMinutes: 1440, // 24 hours
      description: "Daily team data collection at 3 AM UTC"
    }
  },
  { 
    name: "Fetch Events", 
    function: "fetch-events", 
    group: "data-sync",
    scheduleConfig: {
      category: "core_data",
      defaultFrequency: "daily",
      baseIntervalMinutes: 1440,
      description: "Daily event data collection at 3 AM UTC"
    }
  },
  { 
    name: "Fetch Players", 
    function: "fetch-players", 
    group: "data-sync",
    scheduleConfig: {
      category: "core_data",
      defaultFrequency: "daily",
      baseIntervalMinutes: 1440,
      description: "Daily player data collection at 3 AM UTC"
    }
  },
  { 
    name: "Fetch Player Details", 
    function: "fetch-player-details", 
    group: "data-sync",
    scheduleConfig: {
      category: "core_data",
      defaultFrequency: "daily",
      baseIntervalMinutes: 1440,
      description: "Daily detailed player data collection at 3 AM UTC"
    }
  },
  { 
    name: "Fetch Fixtures", 
    function: "fetch-fixtures", 
    group: "data-sync",
    scheduleConfig: {
      category: "match_dependent",
      defaultFrequency: "match_dependent",
      baseIntervalMinutes: 1440,
      matchDayIntervalMinutes: 5,
      nonMatchIntervalMinutes: 60,
      description: "Match-aware fixture data collection"
    }
  },
  { 
    name: "Fetch Live Gameweek", 
    function: "fetch-live-gameweek", 
    group: "data-sync",
    scheduleConfig: {
      category: "match_dependent",
      defaultFrequency: "match_dependent",
      baseIntervalMinutes: 1440,
      matchDayIntervalMinutes: 2,
      nonMatchIntervalMinutes: 30,
      description: "Real-time gameweek data during matches"
    }
  },
  { 
    name: "Process Schedules", 
    function: "process-schedules", 
    group: "system",
    scheduleConfig: {
      category: "system",
      defaultFrequency: "fixed_interval",
      baseIntervalMinutes: 1,
      description: "Continuous schedule processing"
    }
  }
];

export const getScheduleConfig = (functionName: string) => {
  const func = functions.find(f => f.function === functionName);
  return func?.scheduleConfig;
};

export const getFunctionsByCategory = (category: string) => {
  return functions.filter(f => f.scheduleConfig.category === category);
};

export const getCategoryDescription = (category: string): string => {
  switch (category) {
    case 'core_data':
      return 'Core data collection functions that run on a daily schedule';
    case 'match_dependent':
      return 'Functions that adjust their frequency based on match status';
    case 'system':
      return 'System maintenance and processing functions';
    case 'analytics':
      return 'Data analysis and reporting functions';
    default:
      return 'Uncategorized functions';
  }
};