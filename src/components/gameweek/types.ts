export interface Pick {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

export interface TeamSelection {
  id: string;
  fpl_team_id: number;
  event: number;
  formation: string;
  captain_id: number;
  vice_captain_id: number;
  picks: Pick[];
  auto_subs: any[] | null;
}

export interface Player {
  id: number;
  web_name: string;
  team: number;
  element_type: number;
}