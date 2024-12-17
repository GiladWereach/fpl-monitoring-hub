export const AVAILABLE_FIELDS = {
  fixture: [
    { label: "Status", value: "status", description: "Match status (e.g., SCHEDULED, LIVE, FINISHED)" },
    { label: "Minutes Played", value: "minutes", description: "Minutes elapsed in the match" },
    { label: "Home Score", value: "team_h_score", description: "Home team score" },
    { label: "Away Score", value: "team_a_score", description: "Away team score" },
  ],
  event: [
    { label: "Finished", value: "finished", description: "Whether the gameweek is finished" },
    { label: "Data Checked", value: "data_checked", description: "Whether data has been verified" },
    { label: "Is Current", value: "is_current", description: "Whether this is the current gameweek" },
    { label: "Is Next", value: "is_next", description: "Whether this is the next gameweek" },
  ],
  player: [
    { label: "Minutes", value: "minutes", description: "Player's minutes played" },
    { label: "Form", value: "form", description: "Player's form rating" },
    { label: "Status", value: "status", description: "Player's availability status" },
    { label: "Chance of Playing", value: "chance_of_playing_next_round", description: "Probability of playing next game" },
  ]
};

export const FIELD_VALUES = {
  status: ["SCHEDULED", "LIVE", "FINISHED", "POSTPONED", "CANCELLED"],
  finished: ["true", "false"],
  data_checked: ["true", "false"],
  is_current: ["true", "false"],
  is_next: ["true", "false"],
  form: ["0", "1", "2", "3", "4", "5"],
  chance_of_playing_next_round: ["0", "25", "50", "75", "100"]
};