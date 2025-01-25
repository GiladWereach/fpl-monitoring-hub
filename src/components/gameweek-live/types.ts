export interface PlayerPerformanceData {
  id: number;
  event_id: number;
  player_id: number;
  fixture_id: number | null;
  modified: boolean;
  in_dreamteam: boolean;
  minutes: number;
  total_points: number;
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
  points_calculation?: PointsCalculation;
  player: {
    id: number;
    web_name: string;
    element_type: number;
    team?: {
      short_name: string;
    };
  };
}

export interface PointsCalculation {
  minutes_points: number;
  goals_scored_points: number;
  assist_points: number;
  clean_sheet_points: number;
  goals_conceded_points: number;
  own_goal_points: number;
  penalty_save_points: number;
  penalty_miss_points: number;
  saves_points: number;
  bonus_points: number;
  final_total_points: number;
}

export interface PlayerStatus {
  isAvailable: boolean;
  isDoubtful: boolean;
  chanceOfPlaying: number | null;
  status: string;
  news?: string;
}