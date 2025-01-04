import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { determineMatchStatus } from '@/components/dashboard/services/matchStatusService';
import { MatchCard } from './MatchCard';

interface MatchCardsProps {
  gameweek: number;
  onMatchSelect?: (matchId: number) => void;
  selectedMatchId?: number;
}

const MatchCards = ({ gameweek, onMatchSelect, selectedMatchId }: MatchCardsProps) => {
  // Fetch match status
  const { data: matchStatus } = useQuery({
    queryKey: ['match-status'],
    queryFn: determineMatchStatus,
    refetchInterval: 15000 // Reduced from 30000 to 15000
  });

  // Fetch matches for the gameweek
  const { data: matches, isLoading } = useQuery({
    queryKey: ['gameweek-matches', gameweek],
    queryFn: async () => {
      console.log('Fetching matches for gameweek:', gameweek);
      const { data, error } = await supabase
        .from('fixtures')
        .select(`
          *,
          team_h: teams!fk_fixtures_team_h(name, short_name),
          team_a: teams!fk_fixtures_team_a(name, short_name)
        `)
        .eq('event', gameweek)
        .order('kickoff_time', { ascending: true });
      
      if (error) throw error;
      console.log('Fetched matches:', data);
      return data;
    },
    refetchInterval: matchStatus?.hasActiveMatches ? 15000 : 30000 // Dynamic interval based on match status
  });

  if (isLoading) {
    return <div>Loading matches...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches?.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          matchStatus={matchStatus}
          isSelected={selectedMatchId === match.id}
          onSelect={(matchId) => onMatchSelect?.(matchId)}
        />
      ))}
    </div>
  );
};

export default MatchCards;