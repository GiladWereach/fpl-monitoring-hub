import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePlayerPoints(playerId: number, eventId: number) {
  return useQuery({
    queryKey: ['player-points', playerId, eventId],
    enabled: !!playerId && !!eventId,
    queryFn: async () => {
      console.log(`Fetching points for player ${playerId} in event ${eventId}`);
      
      const { data, error } = await supabase
        .from('player_points_calculation')
        .select(`
          final_total_points,
          minutes_points,
          goals_scored_points,
          assist_points,
          clean_sheet_points,
          goals_conceded_points,
          own_goal_points,
          penalty_save_points,
          penalty_miss_points,
          saves_points,
          bonus_points
        `)
        .eq('player_id', playerId)
        .eq('event_id', eventId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching player points:', error);
        throw error;
      }

      console.log(`Points data for player ${playerId}:`, data);
      return data;
    }
  });
}