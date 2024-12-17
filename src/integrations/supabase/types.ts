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
      calculation_logs: {
        Row: {
          affected_rows: number | null
          calculation_type_id: number | null
          created_at: string | null
          end_time: string | null
          error_message: string | null
          id: number
          performance_metrics: Json | null
          start_time: string | null
          status: string
        }
        Insert: {
          affected_rows?: number | null
          calculation_type_id?: number | null
          created_at?: string | null
          end_time?: string | null
          error_message?: string | null
          id?: number
          performance_metrics?: Json | null
          start_time?: string | null
          status: string
        }
        Update: {
          affected_rows?: number | null
          calculation_type_id?: number | null
          created_at?: string | null
          end_time?: string | null
          error_message?: string | null
          id?: number
          performance_metrics?: Json | null
          start_time?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "calculation_logs_calculation_type_id_fkey"
            columns: ["calculation_type_id"]
            isOneToOne: false
            referencedRelation: "calculation_types"
            referencedColumns: ["id"]
          },
        ]
      }
      calculation_results: {
        Row: {
          calculation_type_id: number | null
          created_at: string | null
          event_id: number | null
          id: number
          is_current: boolean | null
          reference_id: number | null
          result_data: Json
          valid_until: string | null
        }
        Insert: {
          calculation_type_id?: number | null
          created_at?: string | null
          event_id?: number | null
          id?: number
          is_current?: boolean | null
          reference_id?: number | null
          result_data?: Json
          valid_until?: string | null
        }
        Update: {
          calculation_type_id?: number | null
          created_at?: string | null
          event_id?: number | null
          id?: number
          is_current?: boolean | null
          reference_id?: number | null
          result_data?: Json
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calculation_results_calculation_type_id_fkey"
            columns: ["calculation_type_id"]
            isOneToOne: false
            referencedRelation: "calculation_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calculation_results_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      calculation_schedules: {
        Row: {
          calculation_type_id: number | null
          created_at: string | null
          frequency_unit: Database["public"]["Enums"]["frequency_unit"] | null
          frequency_value: number | null
          id: number
          is_active: boolean | null
          last_run: string | null
          next_run: string | null
          trigger_type: Database["public"]["Enums"]["calculation_trigger_type"]
          updated_at: string | null
        }
        Insert: {
          calculation_type_id?: number | null
          created_at?: string | null
          frequency_unit?: Database["public"]["Enums"]["frequency_unit"] | null
          frequency_value?: number | null
          id?: number
          is_active?: boolean | null
          last_run?: string | null
          next_run?: string | null
          trigger_type: Database["public"]["Enums"]["calculation_trigger_type"]
          updated_at?: string | null
        }
        Update: {
          calculation_type_id?: number | null
          created_at?: string | null
          frequency_unit?: Database["public"]["Enums"]["frequency_unit"] | null
          frequency_value?: number | null
          id?: number
          is_active?: boolean | null
          last_run?: string | null
          next_run?: string | null
          trigger_type?: Database["public"]["Enums"]["calculation_trigger_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calculation_schedules_calculation_type_id_fkey"
            columns: ["calculation_type_id"]
            isOneToOne: false
            referencedRelation: "calculation_types"
            referencedColumns: ["id"]
          },
        ]
      }
      calculation_types: {
        Row: {
          category: Database["public"]["Enums"]["calculation_category"]
          created_at: string | null
          dependent_tables: string[] | null
          description: string | null
          id: number
          is_real_time: boolean | null
          last_modified: string | null
          name: string
          priority: number | null
          requires_cache: boolean | null
          update_frequency: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["calculation_category"]
          created_at?: string | null
          dependent_tables?: string[] | null
          description?: string | null
          id?: number
          is_real_time?: boolean | null
          last_modified?: string | null
          name: string
          priority?: number | null
          requires_cache?: boolean | null
          update_frequency?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["calculation_category"]
          created_at?: string | null
          dependent_tables?: string[] | null
          description?: string | null
          id?: number
          is_real_time?: boolean | null
          last_modified?: string | null
          name?: string
          priority?: number | null
          requires_cache?: boolean | null
          update_frequency?: string | null
        }
        Relationships: []
      }
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
          element_count: number | null
          id: number
          last_updated: string | null
          plural_name: string | null
          plural_name_short: string | null
          singular_name: string | null
          singular_name_short: string | null
          squad_max_play: number | null
          squad_max_select: number | null
          squad_min_play: number | null
          squad_min_select: number | null
          squad_select: number | null
          sub_positions_locked: boolean | null
          ui_shirt_specific: boolean | null
        }
        Insert: {
          element_count?: number | null
          id: number
          last_updated?: string | null
          plural_name?: string | null
          plural_name_short?: string | null
          singular_name?: string | null
          singular_name_short?: string | null
          squad_max_play?: number | null
          squad_max_select?: number | null
          squad_min_play?: number | null
          squad_min_select?: number | null
          squad_select?: number | null
          sub_positions_locked?: boolean | null
          ui_shirt_specific?: boolean | null
        }
        Update: {
          element_count?: number | null
          id?: number
          last_updated?: string | null
          plural_name?: string | null
          plural_name_short?: string | null
          singular_name?: string | null
          singular_name_short?: string | null
          squad_max_play?: number | null
          squad_max_select?: number | null
          squad_min_play?: number | null
          squad_min_select?: number | null
          squad_select?: number | null
          sub_positions_locked?: boolean | null
          ui_shirt_specific?: boolean | null
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
      fixtures: {
        Row: {
          code: number | null
          event: number | null
          finished: boolean | null
          finished_provisional: boolean | null
          id: number
          kickoff_time: string | null
          last_updated: string | null
          minutes: number | null
          processed_for_player_details: boolean | null
          provisional_start_time: boolean | null
          pulse_id: number | null
          started: boolean | null
          stats: Json | null
          team_a: number | null
          team_a_difficulty: number | null
          team_a_score: number | null
          team_h: number | null
          team_h_difficulty: number | null
          team_h_score: number | null
        }
        Insert: {
          code?: number | null
          event?: number | null
          finished?: boolean | null
          finished_provisional?: boolean | null
          id: number
          kickoff_time?: string | null
          last_updated?: string | null
          minutes?: number | null
          processed_for_player_details?: boolean | null
          provisional_start_time?: boolean | null
          pulse_id?: number | null
          started?: boolean | null
          stats?: Json | null
          team_a?: number | null
          team_a_difficulty?: number | null
          team_a_score?: number | null
          team_h?: number | null
          team_h_difficulty?: number | null
          team_h_score?: number | null
        }
        Update: {
          code?: number | null
          event?: number | null
          finished?: boolean | null
          finished_provisional?: boolean | null
          id?: number
          kickoff_time?: string | null
          last_updated?: string | null
          minutes?: number | null
          processed_for_player_details?: boolean | null
          provisional_start_time?: boolean | null
          pulse_id?: number | null
          started?: boolean | null
          stats?: Json | null
          team_a?: number | null
          team_a_difficulty?: number | null
          team_a_score?: number | null
          team_h?: number | null
          team_h_difficulty?: number | null
          team_h_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_fixtures_event"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_fixtures_team_a"
            columns: ["team_a"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_fixtures_team_h"
            columns: ["team_h"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      function_schedules: {
        Row: {
          active_period_end: string | null
          active_period_start: string | null
          base_interval_minutes: number | null
          created_at: string | null
          fixed_time: string | null
          frequency_type: Database["public"]["Enums"]["schedule_frequency"]
          function_name: string
          group_id: string | null
          id: string
          last_execution_at: string | null
          match_day_interval_minutes: number | null
          max_concurrent_executions: number | null
          next_execution_at: string | null
          non_match_interval_minutes: number | null
          retry_count: number | null
          retry_delay_seconds: number | null
          status: Database["public"]["Enums"]["schedule_status"] | null
          timeout_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          active_period_end?: string | null
          active_period_start?: string | null
          base_interval_minutes?: number | null
          created_at?: string | null
          fixed_time?: string | null
          frequency_type: Database["public"]["Enums"]["schedule_frequency"]
          function_name: string
          group_id?: string | null
          id?: string
          last_execution_at?: string | null
          match_day_interval_minutes?: number | null
          max_concurrent_executions?: number | null
          next_execution_at?: string | null
          non_match_interval_minutes?: number | null
          retry_count?: number | null
          retry_delay_seconds?: number | null
          status?: Database["public"]["Enums"]["schedule_status"] | null
          timeout_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          active_period_end?: string | null
          active_period_start?: string | null
          base_interval_minutes?: number | null
          created_at?: string | null
          fixed_time?: string | null
          frequency_type?: Database["public"]["Enums"]["schedule_frequency"]
          function_name?: string
          group_id?: string | null
          id?: string
          last_execution_at?: string | null
          match_day_interval_minutes?: number | null
          max_concurrent_executions?: number | null
          next_execution_at?: string | null
          non_match_interval_minutes?: number | null
          retry_count?: number | null
          retry_delay_seconds?: number | null
          status?: Database["public"]["Enums"]["schedule_status"] | null
          timeout_seconds?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "function_schedules_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "schedule_groups"
            referencedColumns: ["id"]
          },
        ]
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
      gameweek_live_performance: {
        Row: {
          assists: number | null
          bonus: number | null
          bps: number | null
          clean_sheets: number | null
          creativity: number | null
          event_id: number | null
          expected_assists: number | null
          expected_goal_involvements: number | null
          expected_goals: number | null
          expected_goals_conceded: number | null
          fixture_id: number | null
          goals_conceded: number | null
          goals_scored: number | null
          ict_index: number | null
          id: number
          in_dreamteam: boolean | null
          influence: number | null
          last_updated: string | null
          minutes: number | null
          modified: boolean | null
          own_goals: number | null
          penalties_missed: number | null
          penalties_saved: number | null
          player_id: number | null
          points_breakdown: Json | null
          red_cards: number | null
          saves: number | null
          starts: number | null
          threat: number | null
          total_points: number | null
          yellow_cards: number | null
        }
        Insert: {
          assists?: number | null
          bonus?: number | null
          bps?: number | null
          clean_sheets?: number | null
          creativity?: number | null
          event_id?: number | null
          expected_assists?: number | null
          expected_goal_involvements?: number | null
          expected_goals?: number | null
          expected_goals_conceded?: number | null
          fixture_id?: number | null
          goals_conceded?: number | null
          goals_scored?: number | null
          ict_index?: number | null
          id?: number
          in_dreamteam?: boolean | null
          influence?: number | null
          last_updated?: string | null
          minutes?: number | null
          modified?: boolean | null
          own_goals?: number | null
          penalties_missed?: number | null
          penalties_saved?: number | null
          player_id?: number | null
          points_breakdown?: Json | null
          red_cards?: number | null
          saves?: number | null
          starts?: number | null
          threat?: number | null
          total_points?: number | null
          yellow_cards?: number | null
        }
        Update: {
          assists?: number | null
          bonus?: number | null
          bps?: number | null
          clean_sheets?: number | null
          creativity?: number | null
          event_id?: number | null
          expected_assists?: number | null
          expected_goal_involvements?: number | null
          expected_goals?: number | null
          expected_goals_conceded?: number | null
          fixture_id?: number | null
          goals_conceded?: number | null
          goals_scored?: number | null
          ict_index?: number | null
          id?: number
          in_dreamteam?: boolean | null
          influence?: number | null
          last_updated?: string | null
          minutes?: number | null
          modified?: boolean | null
          own_goals?: number | null
          penalties_missed?: number | null
          penalties_saved?: number | null
          player_id?: number | null
          points_breakdown?: Json | null
          red_cards?: number | null
          saves?: number | null
          starts?: number | null
          threat?: number | null
          total_points?: number | null
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gameweek_live_performance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gameweek_live_performance_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gameweek_live_performance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_fixtures: {
        Row: {
          difficulty: number | null
          event: number | null
          expected_minutes: number | null
          fixture_id: number | null
          id: number
          is_home: boolean | null
          last_updated: string | null
          player_id: number | null
        }
        Insert: {
          difficulty?: number | null
          event?: number | null
          expected_minutes?: number | null
          fixture_id?: number | null
          id?: number
          is_home?: boolean | null
          last_updated?: string | null
          player_id?: number | null
        }
        Update: {
          difficulty?: number | null
          event?: number | null
          expected_minutes?: number | null
          fixture_id?: number | null
          id?: number
          is_home?: boolean | null
          last_updated?: string | null
          player_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_fixtures_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_fixtures_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_fixtures_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_history: {
        Row: {
          assists: number | null
          bonus: number | null
          bps: number | null
          clean_sheets: number | null
          creativity: number | null
          expected_assists: number | null
          expected_goal_involvements: number | null
          expected_goals: number | null
          expected_goals_conceded: number | null
          fixture_id: number | null
          goals_conceded: number | null
          goals_scored: number | null
          ict_index: number | null
          id: number
          influence: number | null
          kickoff_time: string | null
          last_updated: string | null
          minutes: number | null
          opponent_team: number | null
          own_goals: number | null
          penalties_missed: number | null
          penalties_saved: number | null
          player_id: number | null
          red_cards: number | null
          round: number | null
          saves: number | null
          selected: number | null
          starts: number | null
          team_a_score: number | null
          team_h_score: number | null
          threat: number | null
          total_points: number | null
          transfers_balance: number | null
          transfers_in: number | null
          transfers_out: number | null
          value: number | null
          was_home: boolean | null
          yellow_cards: number | null
        }
        Insert: {
          assists?: number | null
          bonus?: number | null
          bps?: number | null
          clean_sheets?: number | null
          creativity?: number | null
          expected_assists?: number | null
          expected_goal_involvements?: number | null
          expected_goals?: number | null
          expected_goals_conceded?: number | null
          fixture_id?: number | null
          goals_conceded?: number | null
          goals_scored?: number | null
          ict_index?: number | null
          id?: number
          influence?: number | null
          kickoff_time?: string | null
          last_updated?: string | null
          minutes?: number | null
          opponent_team?: number | null
          own_goals?: number | null
          penalties_missed?: number | null
          penalties_saved?: number | null
          player_id?: number | null
          red_cards?: number | null
          round?: number | null
          saves?: number | null
          selected?: number | null
          starts?: number | null
          team_a_score?: number | null
          team_h_score?: number | null
          threat?: number | null
          total_points?: number | null
          transfers_balance?: number | null
          transfers_in?: number | null
          transfers_out?: number | null
          value?: number | null
          was_home?: boolean | null
          yellow_cards?: number | null
        }
        Update: {
          assists?: number | null
          bonus?: number | null
          bps?: number | null
          clean_sheets?: number | null
          creativity?: number | null
          expected_assists?: number | null
          expected_goal_involvements?: number | null
          expected_goals?: number | null
          expected_goals_conceded?: number | null
          fixture_id?: number | null
          goals_conceded?: number | null
          goals_scored?: number | null
          ict_index?: number | null
          id?: number
          influence?: number | null
          kickoff_time?: string | null
          last_updated?: string | null
          minutes?: number | null
          opponent_team?: number | null
          own_goals?: number | null
          penalties_missed?: number | null
          penalties_saved?: number | null
          player_id?: number | null
          red_cards?: number | null
          round?: number | null
          saves?: number | null
          selected?: number | null
          starts?: number | null
          team_a_score?: number | null
          team_h_score?: number | null
          threat?: number | null
          total_points?: number | null
          transfers_balance?: number | null
          transfers_in?: number | null
          transfers_out?: number | null
          value?: number | null
          was_home?: boolean | null
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_history_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_history_opponent_team_fkey"
            columns: ["opponent_team"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_history_round_fkey"
            columns: ["round"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      player_history_past: {
        Row: {
          assists: number | null
          bonus: number | null
          bps: number | null
          clean_sheets: number | null
          creativity: number | null
          element_code: number | null
          end_cost: number | null
          expected_assists: number | null
          expected_goal_involvements: number | null
          expected_goals: number | null
          expected_goals_conceded: number | null
          goals_conceded: number | null
          goals_scored: number | null
          ict_index: number | null
          id: number
          influence: number | null
          last_updated: string | null
          minutes: number | null
          own_goals: number | null
          penalties_missed: number | null
          penalties_saved: number | null
          player_id: number | null
          red_cards: number | null
          saves: number | null
          season_name: string | null
          start_cost: number | null
          starts: number | null
          threat: number | null
          total_points: number | null
          yellow_cards: number | null
        }
        Insert: {
          assists?: number | null
          bonus?: number | null
          bps?: number | null
          clean_sheets?: number | null
          creativity?: number | null
          element_code?: number | null
          end_cost?: number | null
          expected_assists?: number | null
          expected_goal_involvements?: number | null
          expected_goals?: number | null
          expected_goals_conceded?: number | null
          goals_conceded?: number | null
          goals_scored?: number | null
          ict_index?: number | null
          id?: number
          influence?: number | null
          last_updated?: string | null
          minutes?: number | null
          own_goals?: number | null
          penalties_missed?: number | null
          penalties_saved?: number | null
          player_id?: number | null
          red_cards?: number | null
          saves?: number | null
          season_name?: string | null
          start_cost?: number | null
          starts?: number | null
          threat?: number | null
          total_points?: number | null
          yellow_cards?: number | null
        }
        Update: {
          assists?: number | null
          bonus?: number | null
          bps?: number | null
          clean_sheets?: number | null
          creativity?: number | null
          element_code?: number | null
          end_cost?: number | null
          expected_assists?: number | null
          expected_goal_involvements?: number | null
          expected_goals?: number | null
          expected_goals_conceded?: number | null
          goals_conceded?: number | null
          goals_scored?: number | null
          ict_index?: number | null
          id?: number
          influence?: number | null
          last_updated?: string | null
          minutes?: number | null
          own_goals?: number | null
          penalties_missed?: number | null
          penalties_saved?: number | null
          player_id?: number | null
          red_cards?: number | null
          saves?: number | null
          season_name?: string | null
          start_cost?: number | null
          starts?: number | null
          threat?: number | null
          total_points?: number | null
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_history_past_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_points_calculation: {
        Row: {
          assist_points: number | null
          bonus_points: number | null
          card_points: number | null
          clean_sheet_points: number | null
          event_id: number | null
          final_total_points: number | null
          fixture_id: number | null
          goals_conceded_points: number | null
          goals_scored_points: number | null
          id: number
          last_updated: string | null
          minutes_points: number | null
          own_goal_points: number | null
          penalty_miss_points: number | null
          penalty_save_points: number | null
          player_id: number | null
          raw_total_points: number | null
          saves_points: number | null
        }
        Insert: {
          assist_points?: number | null
          bonus_points?: number | null
          card_points?: number | null
          clean_sheet_points?: number | null
          event_id?: number | null
          final_total_points?: number | null
          fixture_id?: number | null
          goals_conceded_points?: number | null
          goals_scored_points?: number | null
          id?: number
          last_updated?: string | null
          minutes_points?: number | null
          own_goal_points?: number | null
          penalty_miss_points?: number | null
          penalty_save_points?: number | null
          player_id?: number | null
          raw_total_points?: number | null
          saves_points?: number | null
        }
        Update: {
          assist_points?: number | null
          bonus_points?: number | null
          card_points?: number | null
          clean_sheet_points?: number | null
          event_id?: number | null
          final_total_points?: number | null
          fixture_id?: number | null
          goals_conceded_points?: number | null
          goals_scored_points?: number | null
          id?: number
          last_updated?: string | null
          minutes_points?: number | null
          own_goal_points?: number | null
          penalty_miss_points?: number | null
          penalty_save_points?: number | null
          player_id?: number | null
          raw_total_points?: number | null
          saves_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_points_calculation_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_points_calculation_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_points_calculation_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
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
          team: number | null
          team_code: number | null
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
          team?: number | null
          team_code?: number | null
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
          team?: number | null
          team_code?: number | null
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
      profiles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      schedule_execution_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_details: string | null
          execution_duration_ms: number | null
          id: string
          schedule_id: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_details?: string | null
          execution_duration_ms?: number | null
          id?: string
          schedule_id: string
          started_at?: string
          status: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_details?: string | null
          execution_duration_ms?: number | null
          id?: string
          schedule_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_execution_logs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      schedules: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          event_conditions: Json | null
          event_config: Json | null
          execution_config: Json
          execution_window: Json | null
          function_name: string
          id: string
          last_execution_at: string | null
          next_execution_at: string | null
          schedule_type: Database["public"]["Enums"]["schedule_type"]
          time_config: Json | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          event_conditions?: Json | null
          event_config?: Json | null
          execution_config?: Json
          execution_window?: Json | null
          function_name: string
          id?: string
          last_execution_at?: string | null
          next_execution_at?: string | null
          schedule_type: Database["public"]["Enums"]["schedule_type"]
          time_config?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          event_conditions?: Json | null
          event_config?: Json | null
          execution_config?: Json
          execution_window?: Json | null
          function_name?: string
          id?: string
          last_execution_at?: string | null
          next_execution_at?: string | null
          schedule_type?: Database["public"]["Enums"]["schedule_type"]
          time_config?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      cleanup_old_execution_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_active_cron_jobs: {
        Args: Record<PropertyKey, never>
        Returns: {
          jobname: string
          schedule: string
          last_run: string
          next_run: string
          active: boolean
        }[]
      }
      get_active_schedules: {
        Args: {
          check_time?: string
        }
        Returns: {
          id: string
          function_name: string
          next_execution_at: string
          group_name: string
          frequency_type: Database["public"]["Enums"]["schedule_frequency"]
        }[]
      }
      update_next_execution_time: {
        Args: {
          schedule_id: string
          execution_time?: string
        }
        Returns: string
      }
    }
    Enums: {
      calculation_category:
        | "live_calculations"
        | "historical_analysis"
        | "predictive_calculations"
        | "aggregated_statistics"
      calculation_trigger_type: "time_based" | "event_based"
      event_trigger_type: "deadline" | "kickoff" | "match_status"
      frequency_unit: "minutes" | "hours" | "days"
      schedule_frequency: "fixed_interval" | "match_dependent" | "daily"
      schedule_status: "active" | "paused" | "error"
      schedule_type: "time_based" | "event_based"
      time_schedule_type: "interval" | "daily" | "weekly" | "monthly" | "cron"
      user_role: "admin" | "user"
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
