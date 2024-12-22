import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { getMatchStatus } from '@/services/matchStatusService';

interface MatchCardsProps {
  gameweek: number;
  onMatchSelect?: (matchId: number) => void;
  selectedMatchId?: number;
}

const MatchCards = ({ gameweek, onMatchSelect, selectedMatchId }: MatchCardsProps) => {
  // Fetch match status
  const { data: matchStatus } = useQuery({
    queryKey: ['match-status'],
    queryFn: getMatchStatus,
    refetchInterval: 30000
  });

  // Fetch matches for the gameweek
  const { data: matches, isLoading } = useQuery({
    queryKey: ['gameweek-matches', gameweek],
    queryFn: async () => {
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
    refetchInterval: 30000
  });

  if (isLoading) {
    return <div>Loading matches...</div>;
  }

  const getMatchStatusInfo = (match: any) => {
    const kickoff = new Date(match.kickoff_time);
    const now = new Date();
    
    // Check for postponed matches first
    if (match.postponed) {
      return { 
        status: 'POSTPONED', 
        color: 'bg-red-500', 
        isPreMatch: false,
        reason: match.postponement_reason
      };
    }
    
    // Pre-match window check
    if (!match.started && matchStatus?.isPreMatch) {
      const preMatchStart = new Date(kickoff);
      preMatchStart.setHours(preMatchStart.getHours() - 2);
      if (now >= preMatchStart) {
        return { status: 'PRE-MATCH', color: 'bg-yellow-500', isPreMatch: true };
      }
    }

    // Standard status checks
    if (!match.started) {
      return { status: 'UPCOMING', color: 'bg-gray-500', isPreMatch: false };
    }
    if (match.finished_provisional) {
      return { status: 'FINISHED', color: 'bg-blue-500', isPreMatch: false };
    }
    if (match.finished && !match.finished_provisional) {
      return { status: 'CALCULATING', color: 'bg-yellow-500', isPreMatch: false };
    }
    if (match.started && !match.finished) {
      return { status: 'LIVE', color: 'bg-green-500', isPreMatch: false };
    }
    return { status: 'UNKNOWN', color: 'bg-gray-500', isPreMatch: false };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches?.map((match) => {
        const { status, color, reason } = getMatchStatusInfo(match);
        const isSelected = selectedMatchId === match.id;
        
        return (
          <Card 
            key={match.id} 
            className={`p-4 relative cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
              isSelected ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onMatchSelect?.(match.id)}
          >
            <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${color}`} />
            
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {format(new Date(match.kickoff_time), 'MMM d, HH:mm')}
                </span>
                <Badge variant={status === 'POSTPONED' ? 'destructive' : 'outline'}>
                  {status}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-semibold">{match.team_h.name}</p>
                </div>
                <div className="px-4 text-xl font-bold">
                  {match.started && !match.postponed ? 
                    `${match.team_h_score ?? 0} - ${match.team_a_score ?? 0}` : 
                    'vs'
                  }
                </div>
                <div className="flex-1 text-right">
                  <p className="font-semibold">{match.team_a.name}</p>
                </div>
              </div>

              {match.started && !match.finished_provisional && !match.postponed && (
                <div className="text-center text-sm text-gray-500">
                  {match.minutes}'
                </div>
              )}

              {match.postponed && reason && (
                <div className="text-center text-sm text-red-500 mt-2">
                  {reason}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default MatchCards;