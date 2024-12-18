export const functions = [
  { name: "Fetch Teams", function: "fetch-teams", group: "data-sync" },
  { name: "Fetch Events", function: "fetch-events", group: "data-sync" },
  { name: "Fetch Game Settings", function: "fetch-game-settings", group: "data-sync" },
  { name: "Fetch Element Types", function: "fetch-element-types", group: "data-sync" },
  { name: "Fetch Chips", function: "fetch-chips", group: "data-sync" },
  { name: "Fetch Players", function: "fetch-players", group: "data-sync" },
  { name: "Fetch Player Details", function: "fetch-player-details", group: "data-sync" },
  { name: "Fetch Scoring Rules", function: "fetch-scoring-rules", group: "data-sync" },
  { name: "Fetch Fixtures", function: "fetch-fixtures", group: "data-sync" },
  { 
    name: "Fetch Live Gameweek", 
    function: "fetch-live-gameweek", 
    group: "data-sync",
    defaultSchedule: {
      frequency_type: 'match_dependent',
      match_day_interval_minutes: 2,
      non_match_interval_minutes: 60,
      status: 'active'
    }
  },
  { name: "Process Schedules", function: "process-schedules", group: "system" }
];