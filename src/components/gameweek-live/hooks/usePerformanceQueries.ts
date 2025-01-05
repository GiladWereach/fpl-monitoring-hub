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
      
      // First, let's get the points calculation data
      const { data: pointsData, error: pointsError } = await supabase
        .from('player_points_calculation')
        .select('*')
        .eq('event_id', gameweek);

      if (pointsError) {
        console.error('Error fetching points calculation:', pointsError);
        throw pointsError;
      }

      console.log('Points calculation data:', pointsData);

      // Then get the performance data with player info
      const query = supabase
        .from('gameweek_live_performance')
        .select(`
          *,
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
      
      const { data: performanceData, error: perfError } = await query;
      
      if (perfError) {
        console.error('Error fetching performances:', perfError);
        toast({
          title: "Error loading player performances",
          description: "Please try refreshing the page",
          variant: "destructive",
        });
        throw perfError;
      }

      // Combine the data
      const combinedData = performanceData?.map(perf => {
        const pointsCalc = pointsData?.find(p => 
          p.player_id === perf.player_id && 
          p.event_id === gameweek &&
          p.fixture_id === perf.fixture_id
        );

        console.log(`Points data for player ${perf.player_id}:`, {
          performance: perf,
          pointsCalculation: pointsCalc,
          combinedPoints: pointsCalc?.final_total_points || 0
        });

        return {
          ...perf,
          points_calculation: pointsCalc ? {
            minutes_points: pointsCalc.minutes_points,
            goals_scored_points: pointsCalc.goals_scored_points,
            assist_points: pointsCalc.assist_points,
            clean_sheet_points: pointsCalc.clean_sheet_points,
            goals_conceded_points: pointsCalc.goals_conceded_points,
            own_goal_points: pointsCalc.own_goal_points,
            penalty_save_points: pointsCalc.penalty_save_points,
            penalty_miss_points: pointsCalc.penalty_miss_points,
            saves_points: pointsCalc.saves_points,
            bonus_points: pointsCalc.bonus_points,
            final_total_points: pointsCalc.final_total_points
          } : null
        };
      });

      // Sort by total points
      const sortedData = combinedData?.sort((a, b) => 
        (b.points_calculation?.final_total_points || 0) - 
        (a.points_calculation?.final_total_points || 0)
      );

      if (sortedData && sortedData.length > 0) {
        console.log('Sample combined performance:', {
          player: sortedData[0].player.web_name,
          total_points: sortedData[0].points_calculation?.final_total_points,
          minutes: sortedData[0].minutes,
          goals: sortedData[0].goals_scored,
          assists: sortedData[0].assists,
          points_calculation: sortedData[0].points_calculation
        });
      }

      return sortedData as PlayerPerformanceData[];
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