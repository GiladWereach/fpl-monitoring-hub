export interface LivePerformance {
  event_id: number;
  player_id: number;
  fixture_id: number;
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
}

export interface Player {
  id: number;
  element_type: number;
}

export interface ScoringRules {
  long_play: number;
  short_play: number;
  goals_scored_gkp: number;
  goals_scored_def: number;
  goals_scored_mid: number;
  goals_scored_fwd: number;
  clean_sheets_gkp: number;
  clean_sheets_def: number;
  clean_sheets_mid: number;
  goals_conceded_def: number;
  goals_conceded_gkp: number;
  assists: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  own_goals: number;
  saves: number;
}

export interface PointsCalculation {
  event_id: number;
  player_id: number;
  fixture_id: number;
  minutes_points: number;
  goals_scored_points: number;
  clean_sheet_points: number;
  goals_conceded_points: number;
  saves_points: number;
  assist_points: number;
  penalty_save_points: number;
  penalty_miss_points: number;
  own_goal_points: number;
  card_points: number;
  bonus_points: number;
  raw_total_points: number;
  final_total_points: number;
}