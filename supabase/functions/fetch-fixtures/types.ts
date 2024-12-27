export interface FPLFixture {
  id: number;
  event: number;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
  started: boolean;
  finished: boolean;
  finished_provisional: boolean;
  kickoff_time: string;
  minutes: number;
  provisional_start_time: boolean;
  stats: Array<{
    identifier: string;
    stats: Array<{
      value: number;
      element: number;
    }>;
  }>;
}

export interface TransformedFixture {
  id: number;
  code: number | null;
  event: number;
  kickoff_time: string;
  minutes: number;
  provisional_start_time: boolean;
  started: boolean;
  finished: boolean;
  finished_provisional: boolean;
  team_h: number;
  team_h_score: number | null;
  team_h_difficulty: number | null;
  team_a: number;
  team_a_score: number | null;
  team_a_difficulty: number | null;
  stats: Record<string, any>;
  last_updated: string;
  processed_for_player_details: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}