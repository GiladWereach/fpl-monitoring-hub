import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTeamData = (teamId: string | null) => {
  const { toast } = useToast();

  // Query to check existing team data
  const { data: existingTeam } = useQuery({
    queryKey: ['existing-team', teamId],
    enabled: !!teamId,
    queryFn: async () => {
      console.log('Checking if team exists:', teamId);
      const { data, error } = await supabase
        .from('fpl_teams')
        .select('*')
        .eq('fpl_team_id', teamId)
        .order('event', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      console.log('Found existing team:', data);
      return data;
    }
  });

  // Query for team data
  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ['team-data', teamId, existingTeam?.event],
    enabled: !!teamId && !!existingTeam,
    queryFn: async () => {
      console.log('Fetching team data for ID:', teamId);
      
      // First try to get data from our database
      const { data: localData, error: localError } = await supabase
        .from('team_selections')
        .select(`
          *,
          team_performances (
            points,
            total_points,
            current_rank,
            overall_rank,
            team_value,
            bank
          )
        `)
        .eq('fpl_team_id', teamId)
        .eq('event', existingTeam.event)
        .maybeSingle();

      if (localData) {
        console.log('Found local team data:', localData);
        return {
          success: true,
          data: {
            team_info: {
              fpl_team_id: parseInt(teamId),
              event: existingTeam.event,
              last_updated: existingTeam.last_fetch
            },
            picks: localData.picks,
            stats: localData.team_performances?.[0] || {},
            formation: {
              formation: localData.formation,
              positions: getFormationPositions(localData.formation)
            }
          }
        };
      }

      // If no local data or it's stale, fetch from FPL API
      console.log('No local data found, fetching from API');
      const response = await fetch(`${window.location.origin}/functions/v1/fetch-team-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: parseInt(teamId) })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch team data');
      }

      return await response.json();
    },
    retry: 1,
    meta: {
      onError: (error: Error) => {
        console.error('Error fetching team data:', error);
        toast({
          title: "Error fetching team data",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  });

  return {
    teamData,
    teamLoading,
    existingTeam
  };
};

// Helper function to calculate formation positions
const getFormationPositions = (formation: string) => {
  const [def, mid, fwd] = formation.split('-').map(Number);
  return {
    defenders: Array.from({ length: def }, (_, i) => i + 2),
    midfielders: Array.from({ length: mid }, (_, i) => i + 2 + def),
    forwards: Array.from({ length: fwd }, (_, i) => i + 2 + def + mid)
  };
};