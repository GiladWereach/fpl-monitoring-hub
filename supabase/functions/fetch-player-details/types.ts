export interface PlayerDetails {
  fixtures: any[];
  history: any[];
  history_past: any[];
}

export interface ProcessedFixture {
  player_id: number;
  fixture_id: number;
  event: number;
  is_home: boolean;
  difficulty: number;
  last_updated: string;
}

export interface ProcessedHistory {
  player_id: number;
  fixture_id: number;
  opponent_team: number;
  round: number;
  kickoff_time: string;
  was_home: boolean;
  team_h_score: number;
  team_a_score: number;
  total_points: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: number;
  creativity: number;
  threat: number;
  ict_index: number;
  starts: number;
  expected_goals: number;
  expected_assists: number;
  expected_goal_involvements: number;
  expected_goals_conceded: number;
  value: number;
  transfers_balance: number;
  selected: number;
  transfers_in: number;
  transfers_out: number;
  last_updated: string;
}