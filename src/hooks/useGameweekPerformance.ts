import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlayerPerformanceData } from '@/components/gameweek-live/types';
import { useToast } from '@/hooks/use-toast';

export function useGameweekPerformance(gameweekId: number | undefined, matchId?: number | null) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['gameweek-performance', gameweekId, matchId],
    enabled: !!gameweekId,
    queryFn: async () => {
      console.log(`Fetching performance data for gameweek ${gameweekId}${matchId ? ` and match ${matchId}` : ''}`);
      
      // First get points calculation data
      const { data: pointsData, error: pointsError } = await supabase
        .from('player_points_calculation')
        .select('*')
        .eq('event_id', gameweekId);

      if (pointsError) {
        console.error('Error fetching points calculation:', pointsError);
        throw pointsError;
      }

      console.log('Points calculation data:', pointsData);

      // Then get performance data with player info
      let query = supabase
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
        .eq('event_id', gameweekId);

      if (matchId) {
        query = query.eq('fixture_id', matchId);
      }

      const { data: performanceData, error: perfError } = await query;

      if (perfError) {
        console.error('Error fetching performance data:', perfError);
        toast({
          title: "Error loading performance data",
          description: "Please try refreshing the page",
          variant: "destructive",
        });
        throw perfError;
      }

      // Combine the data
      const combinedData = performanceData?.map(perf => {
        const pointsCalc = pointsData?.find(p => 
          p.player_id === perf.player_id && 
          p.event_id === gameweekId &&
          p.fixture_id === perf.fixture_id
        );

        console.log(`Points data for player ${perf.player_id}:`, {
          performance: perf,
          pointsCalculation: pointsCalc,
          totalPoints: pointsCalc?.final_total_points || perf.total_points || 0
        });

        return {
          ...perf,
          total_points: pointsCalc?.final_total_points || perf.total_points || 0,
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
        } as PlayerPerformanceData;
      });

      console.log('Combined performance data:', combinedData);
      return combinedData || [];
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });
}