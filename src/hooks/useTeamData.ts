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
      const { data: selectionData, error: selectionError } = await supabase
        .from('team_selections')
        .select(`
          id,
          fpl_team_id,
          event,
          formation,
          captain_id,
          vice_captain_id,
          picks,
          auto_subs
        `)
        .eq('fpl_team_id', teamId)
        .eq('event', existingTeam.event)
        .maybeSingle();

      if (selectionError) {
        console.error('Error fetching team selection:', selectionError);
        throw selectionError;
      }

      // Get performance data separately
      const { data: performanceData, error: performanceError } = await supabase
        .from('team_performances')
        .select(`
          points,
          total_points,
          current_rank,
          overall_rank,
          team_value,
          bank
        `)
        .eq('fpl_team_id', teamId)
        .eq('event', existingTeam.event)
        .maybeSingle();

      if (performanceError) {
        console.error('Error fetching team performance:', performanceError);
        throw performanceError;
      }

      console.log('Team selection data:', selectionData);
      console.log('Team performance data:', performanceData);

      if (selectionData) {
        console.log('Found local team data:', selectionData);
        return {
          success: true,
          data: {
            team_info: {
              fpl_team_id: parseInt(teamId),
              event: existingTeam.event,
              last_updated: existingTeam.last_fetch
            },
            ...selectionData,
            stats: performanceData || {},
            formation: {
              formation: selectionData.formation,
              positions: getFormationPositions(selectionData.formation)
            }
          }
        };
      }

      // If no local data or it's stale, fetch from FPL API
      console.log('No local data found, fetching from API');
      const response = await fetch(`/api/fetch-team-data`, {
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