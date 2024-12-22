export interface LivePerformance {
  id: number;
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