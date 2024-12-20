export interface OwnershipStat {
  event: number;
  player_id: number;
  ownership_percentage: number;
  captain_percentage: number;
  timestamp: Date;
  player_name: string;
  team_name: string;
}

export interface OwnershipResponse {
  success: boolean;
  data: {
    event: number;
    ownership_data: OwnershipStat[];
  };
  error?: string;
  details?: string;
}