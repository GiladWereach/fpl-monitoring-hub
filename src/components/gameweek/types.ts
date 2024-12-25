export interface Pick {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

export interface TeamSelection {
  picks: Pick[];
  formation: string;
  captain_id: number;
  vice_captain_id: number;
  auto_subs: any;
}

export interface Player {
  id: number;
  web_name: string;
  team: number;
  element_type: number;
}