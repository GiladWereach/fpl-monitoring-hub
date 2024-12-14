export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chips: {
        Row: {
          chip_type: string | null
          id: number
          last_updated: string | null
          name: string | null
          number: number | null
          overrides: Json | null
          start_event: number | null
          stop_event: number | null
        }
        Insert: {
          chip_type?: string | null
          id: number
          last_updated?: string | null
          name?: string | null
          number?: number | null
          overrides?: Json | null
          start_event?: number | null
          stop_event?: number | null
        }
        Update: {
          chip_type?: string | null
          id?: number
          last_updated?: string | null
          name?: string | null
          number?: number | null
          overrides?: Json | null
          start_event?: number | null
          stop_event?: number | null
        }
        Relationships: []
      }
      element_types: {
        Row: {
          id: number
          last_updated: string | null
          plural_name: string | null
          plural_name_short: string | null
          singular_name: string | null
          singular_name_short: string | null
          squad_max_play: number | null
          squad_min_play: number | null
          squad_select: number | null
        }
        Insert: {
          id: number
          last_updated?: string | null
          plural_name?: string | null
          plural_name_short?: string | null
          singular_name?: string | null
          singular_name_short?: string | null
          squad_max_play?: number | null
          squad_min_play?: number | null
          squad_select?: number | null
        }
        Update: {
          id?: number
          last_updated?: string | null
          plural_name?: string | null
          plural_name_short?: string | null
          singular_name?: string | null
          singular_name_short?: string | null
          squad_max_play?: number | null
          squad_min_play?: number | null
          squad_select?: number | null
        }
        Relationships: []
      }
      events: {
        Row: {
          average_entry_score: number | null
          chip_plays: Json | null
          data_checked: boolean | null
          deadline_time: string | null
          finished: boolean | null
          highest_score: number | null
          id: number
          is_current: boolean | null
          is_next: boolean | null
          is_previous: boolean | null
          last_updated: string | null
          most_captained: number | null
          most_selected: number | null
          most_transferred_in: number | null
          most_vice_captained: number | null
          name: string | null
          top_element: number | null
          transfers_made: number | null
        }
        Insert: {
          average_entry_score?: number | null
          chip_plays?: Json | null
          data_checked?: boolean | null
          deadline_time?: string | null
          finished?: boolean | null
          highest_score?: number | null
          id: number
          is_current?: boolean | null
          is_next?: boolean | null
          is_previous?: boolean | null
          last_updated?: string | null
          most_captained?: number | null
          most_selected?: number | null
          most_transferred_in?: number | null
          most_vice_captained?: number | null
          name?: string | null
          top_element?: number | null
          transfers_made?: number | null
        }
        Update: {
          average_entry_score?: number | null
          chip_plays?: Json | null
          data_checked?: boolean | null
          deadline_time?: string | null
          finished?: boolean | null
          highest_score?: number | null
          id?: number
          is_current?: boolean | null
          is_next?: boolean | null
          is_previous?: boolean | null
          last_updated?: string | null
          most_captained?: number | null
          most_selected?: number | null
          most_transferred_in?: number | null
          most_vice_captained?: number | null
          name?: string | null
          top_element?: number | null
          transfers_made?: number | null
        }
        Relationships: []
      }
      game_settings: {
        Row: {
          cup_qualifying_method: string | null
          id: number
          last_updated: string | null
          league_join_private_max: number | null
          league_join_public_max: number | null
          league_max_size_private_h2h: number | null
          league_max_size_public_classic: number | null
          league_max_size_public_h2h: number | null
          squad_squadplay: number | null
          squad_squadsize: number | null
          squad_team_limit: number | null
          squad_total_spend: number | null
          transfers_cap: number | null
          transfers_sell_on_fee: number | null
        }
        Insert: {
          cup_qualifying_method?: string | null
          id: number
          last_updated?: string | null
          league_join_private_max?: number | null
          league_join_public_max?: number | null
          league_max_size_private_h2h?: number | null
          league_max_size_public_classic?: number | null
          league_max_size_public_h2h?: number | null
          squad_squadplay?: number | null
          squad_squadsize?: number | null
          squad_team_limit?: number | null
          squad_total_spend?: number | null
          transfers_cap?: number | null
          transfers_sell_on_fee?: number | null
        }
        Update: {
          cup_qualifying_method?: string | null
          id?: number
          last_updated?: string | null
          league_join_private_max?: number | null
          league_join_public_max?: number | null
          league_max_size_private_h2h?: number | null
          league_max_size_public_classic?: number | null
          league_max_size_public_h2h?: number | null
          squad_squadplay?: number | null
          squad_squadsize?: number | null
          squad_team_limit?: number | null
          squad_total_spend?: number | null
          transfers_cap?: number | null
          transfers_sell_on_fee?: number | null
        }
        Relationships: []
      }
      players: {
        Row: {
          assists: number | null
          bonus: number | null
          bps: number | null
          can_select: boolean | null
          can_transact: boolean | null
          chance_of_playing_next_round: number | null
          chance_of_playing_this_round: number | null
          clean_sheets: number | null
          clean_sheets_per_90: number | null
          code: number | null
          corners_and_indirect_freekicks_order: number | null
          corners_and_indirect_freekicks_text: string | null
          cost_change_event: number | null
          cost_change_event_fall: number | null
          cost_change_start: number | null
          cost_change_start_fall: number | null
          creativity: number | null
          creativity_rank: number | null
          creativity_rank_type: number | null
          direct_freekicks_order: number | null
          direct_freekicks_text: string | null
          dreamteam_count: number | null
          element_type: number | null
          ep_next: number | null
          ep_this: number | null
          event_points: number | null
          expected_assists: number | null
          expected_assists_per_90: number | null
          expected_goal_involvements: number | null
          expected_goal_involvements_per_90: number | null
          expected_goals: number | null
          expected_goals_conceded: number | null
          expected_goals_conceded_per_90: number | null
          expected_goals_per_90: number | null
          first_name: string | null
          form: number | null
          form_rank: number | null
          form_rank_type: number | null
          goals_conceded: number | null
          goals_conceded_per_90: number | null
          goals_scored: number | null
          ict_index: number | null
          ict_index_rank: number | null
          ict_index_rank_type: number | null
          id: number
          in_dreamteam: boolean | null
          influence: number | null
          influence_rank: number | null
          influence_rank_type: number | null
          last_updated: string | null
          minutes: number | null
          news: string | null
          news_added: string | null
          now_cost: number | null
          now_cost_rank: number | null
          now_cost_rank_type: number | null
          own_goals: number | null
          penalties_missed: number | null
          penalties_order: number | null
          penalties_saved: number | null
          penalties_text: string | null
          photo: string | null
          points_per_game: number | null
          points_per_game_rank: number | null
          points_per_game_rank_type: number | null
          red_cards: number | null
          region: string | null
          removed: boolean | null
          saves: number | null
          saves_per_90: number | null
          second_name: string | null
          selected_by_percent: number | null
          selected_rank: number | null
          selected_rank_type: number | null
          special: boolean | null
          squad_number: number | null
          starts: number | null
          starts_per_90: number | null
          status: string | null
          team_id: number | null
          threat: number | null
          threat_rank: number | null
          threat_rank_type: number | null
          total_points: number | null
          transfers_in: number | null
          transfers_in_event: number | null
          transfers_out: number | null
          transfers_out_event: number | null
          value_form: number | null
          value_season: number | null
          web_name: string | null
          yellow_cards: number | null
        }
        Insert: {
          assists?: number | null
          bonus?: number | null
          bps?: number | null
          can_select?: boolean | null
          can_transact?: boolean | null
          chance_of_playing_next_round?: number | null
          chance_of_playing_this_round?: number | null
          clean_sheets?: number | null
          clean_sheets_per_90?: number | null
          code?: number | null
          corners_and_indirect_freekicks_order?: number | null
          corners_and_indirect_freekicks_text?: string | null
          cost_change_event?: number | null
          cost_change_event_fall?: number | null
          cost_change_start?: number | null
          cost_change_start_fall?: number | null
          creativity?: number | null
          creativity_rank?: number | null
          creativity_rank_type?: number | null
          direct_freekicks_order?: number | null
          direct_freekicks_text?: string | null
          dreamteam_count?: number | null
          element_type?: number | null
          ep_next?: number | null
          ep_this?: number | null
          event_points?: number | null
          expected_assists?: number | null
          expected_assists_per_90?: number | null
          expected_goal_involvements?: number | null
          expected_goal_involvements_per_90?: number | null
          expected_goals?: number | null
          expected_goals_conceded?: number | null
          expected_goals_conceded_per_90?: number | null
          expected_goals_per_90?: number | null
          first_name?: string | null
          form?: number | null
          form_rank?: number | null
          form_rank_type?: number | null
          goals_conceded?: number | null
          goals_conceded_per_90?: number | null
          goals_scored?: number | null
          ict_index?: number | null
          ict_index_rank?: number | null
          ict_index_rank_type?: number | null
          id: number
          in_dreamteam?: boolean | null
          influence?: number | null
          influence_rank?: number | null
          influence_rank_type?: number | null
          last_updated?: string | null
          minutes?: number | null
          news?: string | null
          news_added?: string | null
          now_cost?: number | null
          now_cost_rank?: number | null
          now_cost_rank_type?: number | null
          own_goals?: number | null
          penalties_missed?: number | null
          penalties_order?: number | null
          penalties_saved?: number | null
          penalties_text?: string | null
          photo?: string | null
          points_per_game?: number | null
          points_per_game_rank?: number | null
          points_per_game_rank_type?: number | null
          red_cards?: number | null
          region?: string | null
          removed?: boolean | null
          saves?: number | null
          saves_per_90?: number | null
          second_name?: string | null
          selected_by_percent?: number | null
          selected_rank?: number | null
          selected_rank_type?: number | null
          special?: boolean | null
          squad_number?: number | null
          starts?: number | null
          starts_per_90?: number | null
          status?: string | null
          team_id?: number | null
          threat?: number | null
          threat_rank?: number | null
          threat_rank_type?: number | null
          total_points?: number | null
          transfers_in?: number | null
          transfers_in_event?: number | null
          transfers_out?: number | null
          transfers_out_event?: number | null
          value_form?: number | null
          value_season?: number | null
          web_name?: string | null
          yellow_cards?: number | null
        }
        Update: {
          assists?: number | null
          bonus?: number | null
          bps?: number | null
          can_select?: boolean | null
          can_transact?: boolean | null
          chance_of_playing_next_round?: number | null
          chance_of_playing_this_round?: number | null
          clean_sheets?: number | null
          clean_sheets_per_90?: number | null
          code?: number | null
          corners_and_indirect_freekicks_order?: number | null
          corners_and_indirect_freekicks_text?: string | null
          cost_change_event?: number | null
          cost_change_event_fall?: number | null
          cost_change_start?: number | null
          cost_change_start_fall?: number | null
          creativity?: number | null
          creativity_rank?: number | null
          creativity_rank_type?: number | null
          direct_freekicks_order?: number | null
          direct_freekicks_text?: string | null
          dreamteam_count?: number | null
          element_type?: number | null
          ep_next?: number | null
          ep_this?: number | null
          event_points?: number | null
          expected_assists?: number | null
          expected_assists_per_90?: number | null
          expected_goal_involvements?: number | null
          expected_goal_involvements_per_90?: number | null
          expected_goals?: number | null
          expected_goals_conceded?: number | null
          expected_goals_conceded_per_90?: number | null
          expected_goals_per_90?: number | null
          first_name?: string | null
          form?: number | null
          form_rank?: number | null
          form_rank_type?: number | null
          goals_conceded?: number | null
          goals_conceded_per_90?: number | null
          goals_scored?: number | null
          ict_index?: number | null
          ict_index_rank?: number | null
          ict_index_rank_type?: number | null
          id?: number
          in_dreamteam?: boolean | null
          influence?: number | null
          influence_rank?: number | null
          influence_rank_type?: number | null
          last_updated?: string | null
          minutes?: number | null
          news?: string | null
          news_added?: string | null
          now_cost?: number | null
          now_cost_rank?: number | null
          now_cost_rank_type?: number | null
          own_goals?: number | null
          penalties_missed?: number | null
          penalties_order?: number | null
          penalties_saved?: number | null
          penalties_text?: string | null
          photo?: string | null
          points_per_game?: number | null
          points_per_game_rank?: number | null
          points_per_game_rank_type?: number | null
          red_cards?: number | null
          region?: string | null
          removed?: boolean | null
          saves?: number | null
          saves_per_90?: number | null
          second_name?: string | null
          selected_by_percent?: number | null
          selected_rank?: number | null
          selected_rank_type?: number | null
          special?: boolean | null
          squad_number?: number | null
          starts?: number | null
          starts_per_90?: number | null
          status?: string | null
          team_id?: number | null
          threat?: number | null
          threat_rank?: number | null
          threat_rank_type?: number | null
          total_points?: number | null
          transfers_in?: number | null
          transfers_in_event?: number | null
          transfers_out?: number | null
          transfers_out_event?: number | null
          value_form?: number | null
          value_season?: number | null
          web_name?: string | null
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_rules: {
        Row: {
          assists: number | null
          bonus: number | null
          clean_sheets_def: number | null
          clean_sheets_fwd: number | null
          clean_sheets_gkp: number | null
          clean_sheets_mid: number | null
          goals_conceded_def: number | null
          goals_conceded_fwd: number | null
          goals_conceded_gkp: number | null
          goals_conceded_mid: number | null
          goals_scored_def: number | null
          goals_scored_fwd: number | null
          goals_scored_gkp: number | null
          goals_scored_mid: number | null
          id: number
          last_updated: string | null
          long_play: number | null
          own_goals: number | null
          penalties_missed: number | null
          penalties_saved: number | null
          red_cards: number | null
          saves: number | null
          short_play: number | null
          yellow_cards: number | null
        }
        Insert: {
          assists?: number | null
          bonus?: number | null
          clean_sheets_def?: number | null
          clean_sheets_fwd?: number | null
          clean_sheets_gkp?: number | null
          clean_sheets_mid?: number | null
          goals_conceded_def?: number | null
          goals_conceded_fwd?: number | null
          goals_conceded_gkp?: number | null
          goals_conceded_mid?: number | null
          goals_scored_def?: number | null
          goals_scored_fwd?: number | null
          goals_scored_gkp?: number | null
          goals_scored_mid?: number | null
          id: number
          last_updated?: string | null
          long_play?: number | null
          own_goals?: number | null
          penalties_missed?: number | null
          penalties_saved?: number | null
          red_cards?: number | null
          saves?: number | null
          short_play?: number | null
          yellow_cards?: number | null
        }
        Update: {
          assists?: number | null
          bonus?: number | null
          clean_sheets_def?: number | null
          clean_sheets_fwd?: number | null
          clean_sheets_gkp?: number | null
          clean_sheets_mid?: number | null
          goals_conceded_def?: number | null
          goals_conceded_fwd?: number | null
          goals_conceded_gkp?: number | null
          goals_conceded_mid?: number | null
          goals_scored_def?: number | null
          goals_scored_fwd?: number | null
          goals_scored_gkp?: number | null
          goals_scored_mid?: number | null
          id?: number
          last_updated?: string | null
          long_play?: number | null
          own_goals?: number | null
          penalties_missed?: number | null
          penalties_saved?: number | null
          red_cards?: number | null
          saves?: number | null
          short_play?: number | null
          yellow_cards?: number | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          code: number | null
          draw: number | null
          form: string | null
          id: number
          last_updated: string | null
          loss: number | null
          name: string | null
          played: number | null
          points: number | null
          position: number | null
          pulse_id: number | null
          short_name: string | null
          strength: number | null
          strength_attack_away: number | null
          strength_attack_home: number | null
          strength_defence_away: number | null
          strength_defence_home: number | null
          strength_overall_away: number | null
          strength_overall_home: number | null
          team_division: number | null
          win: number | null
        }
        Insert: {
          code?: number | null
          draw?: number | null
          form?: string | null
          id: number
          last_updated?: string | null
          loss?: number | null
          name?: string | null
          played?: number | null
          points?: number | null
          position?: number | null
          pulse_id?: number | null
          short_name?: string | null
          strength?: number | null
          strength_attack_away?: number | null
          strength_attack_home?: number | null
          strength_defence_away?: number | null
          strength_defence_home?: number | null
          strength_overall_away?: number | null
          strength_overall_home?: number | null
          team_division?: number | null
          win?: number | null
        }
        Update: {
          code?: number | null
          draw?: number | null
          form?: string | null
          id?: number
          last_updated?: string | null
          loss?: number | null
          name?: string | null
          played?: number | null
          points?: number | null
          position?: number | null
          pulse_id?: number | null
          short_name?: string | null
          strength?: number | null
          strength_attack_away?: number | null
          strength_attack_home?: number | null
          strength_defence_away?: number | null
          strength_defence_home?: number | null
          strength_overall_away?: number | null
          strength_overall_home?: number | null
          team_division?: number | null
          win?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never