export interface TeamResponse {
  success: boolean;
  data?: {
    team_info: TeamInfo;
    picks: PlayerSelection[];
    stats: MatchdayStats;
    formation: FormationData;
  };
  error?: string;
  code?: number;
  details?: string;
}

export interface TeamInfo {
  fpl_team_id: number;
  event: number;
  last_updated: string;
}

export interface PlayerSelection {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

export interface MatchdayStats {
  points: number;
  total_points: number;
  current_rank: number;
  overall_rank: number;
  team_value: number;
  bank: number;
}

export interface FormationData {
  formation: string;
  positions: {
    defenders: number[];
    midfielders: number[];
    forwards: number[];
  };
}