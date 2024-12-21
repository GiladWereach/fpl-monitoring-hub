export const functions = [
  { 
    name: "Fetch Teams", 
    function: "fetch-teams", 
    group: "data-sync",
    defaultSchedule: {
      frequency_type: 'daily',
      fixed_time: '03:00',
      status: 'active'
    }
  },
  { 
    name: "Fetch Events", 
    function: "fetch-events", 
    group: "data-sync",
    defaultSchedule: {
      frequency_type: 'daily',
      fixed_time: '03:05',
      status: 'active'
    }
  },
  { 
    name: "Fetch Players", 
    function: "fetch-players", 
    group: "data-sync",
    defaultSchedule: {
      frequency_type: 'daily',
      fixed_time: '03:10',
      status: 'active'
    }
  },
  { 
    name: "Fetch Player Details", 
    function: "fetch-player-details", 
    group: "data-sync",
    defaultSchedule: {
      frequency_type: 'daily',
      fixed_time: '03:15',
      status: 'active'
    }
  },
  { 
    name: "Fetch Fixtures", 
    function: "fetch-fixtures", 
    group: "data-sync",
    defaultSchedule: {
      frequency_type: 'match_dependent',
      match_day_interval_minutes: 2,
      non_match_interval_minutes: 30,
      status: 'active'
    }
  },
  { 
    name: "Fetch Live Gameweek", 
    function: "fetch-live-gameweek", 
    group: "data-sync",
    defaultSchedule: {
      frequency_type: 'match_dependent',
      match_day_interval_minutes: 2,
      non_match_interval_minutes: 30,
      status: 'active'
    }
  },
  { 
    name: "Process Schedules", 
    function: "process-schedules", 
    group: "system" 
  }
];