import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlayerPerformanceData } from '../types';
import { useToast } from '@/hooks/use-toast';

export const usePerformanceQueries = (gameweek: number, matchId?: number | null) => {
  const { toast } = useToast();

  const performancesQuery = useQuery({
    queryKey: ['player-performances', gameweek, matchId],
    queryFn: async () => {
      console.log('Fetching performances for gameweek:', gameweek, 'match:', matchId);
      const query = supabase
        .from('gameweek_live_performance')
        .select(`
          *,
          points:player_points_calculation(
            minutes_points,
            goals_scored_points,
            assist_points,
            clean_sheet_points,
            goals_conceded_points,
            own_goal_points,
            penalty_save_points,
            penalty_miss_points,
            saves_points,
            bonus_points,
            final_total_points
          ),
          player:players(
            id,
            first_name,
            second_name,
            web_name,
            element_type,
            team:teams(
              short_name
            )
          )
        `)
        .eq('event_id', gameweek);

      if (matchId) {
        query.eq('fixture_id', matchId);
      }
      
      const { data, error } = await query.order('total_points', { ascending: false });
      
      if (error) {
        console.error('Error fetching performances:', error);
        toast({
          title: "Error loading player performances",
          description: "Please try refreshing the page",
          variant: "destructive",
        });
        throw error;
      }
      
      // Add detailed logging
      console.log('Raw performance data:', data);
      if (data && data.length > 0) {
        console.log('Sample player points:', {
          player: data[0].player.web_name,
          points: data[0].points,
          total: data[0].total_points
        });
      }
      
      return data as unknown as PlayerPerformanceData[];
    },
    refetchInterval: 60000,
  });

  const matchDetailsQuery = useQuery({
    queryKey: ['match-details', matchId],
    enabled: !!matchId,
    queryFn: async () => {
      console.log('Fetching match details for ID:', matchId);
      const { data, error } = await supabase
        .from('fixtures')
        .select(`
          team_h:teams!fk_fixtures_team_h(short_name),
          team_a:teams!fk_fixtures_team_a(short_name)
        `)
        .eq('id', matchId)
        .single();
      
      if (error) {
        console.error('Error fetching match details:', error);
        toast({
          title: "Error loading match details",
          description: "Please try refreshing the page",
          variant: "destructive",
        });
        throw error;
      }
      
      console.log('Fetched match details:', data);
      return {
        homeTeam: data.team_h.short_name,
        awayTeam: data.team_a.short_name
      };
    }
  });

  return {
    performancesQuery,
    matchDetailsQuery
  };
};