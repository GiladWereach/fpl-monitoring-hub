export interface PlayerPerformanceData {
  id: number;
  assists: number;
  bonus: number;
  bps: number;
  clean_sheets: number;
  goals_scored: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  minutes: number;
  total_points: number;
  fixture_id: number | null;
  points_calculation: PointsCalculation | null;
  event_id?: number;
  creativity?: number;
  expected_assists?: number;
  expected_goal_involvements?: number;
  expected_goals?: number;
  player: {
    id: number;
    first_name: string;
    second_name: string;
    web_name: string;
    element_type: number;
    team: {
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

export interface FixturePerformance extends PlayerPerformanceData {
  fixture_id: number;
}