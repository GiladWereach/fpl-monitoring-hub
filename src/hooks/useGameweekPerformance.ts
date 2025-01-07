import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlayerPerformanceData } from '@/components/gameweek-live/types';

export function useGameweekPerformance(gameweekId: number | undefined, matchId?: number | null) {
  return useQuery({
    queryKey: ['gameweek-performance', gameweekId, matchId],
    enabled: !!gameweekId,
    queryFn: async () => {
      console.log(`Fetching performance data for gameweek ${gameweekId}${matchId ? ` and match ${matchId}` : ''}`);
      
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

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching performance data:', error);
        throw error;
      }

      console.log(`Fetched ${data?.length || 0} performance records`);
      return data as PlayerPerformanceData[];
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });
}