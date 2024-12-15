import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface MatchCardsProps {
  gameweek: number;
  onMatchSelect?: (matchId: number) => void;
  selectedMatchId?: number;
}

const MatchCards = ({ gameweek, onMatchSelect, selectedMatchId }: MatchCardsProps) => {
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
      return data;
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  if (isLoading) {
    return <div>Loading matches...</div>;
  }

  const getMatchStatus = (match: any) => {
    if (!match.started) return { status: 'UPCOMING', color: 'bg-gray-500' };
    if (match.started && !match.finished) return { status: 'LIVE', color: 'bg-green-500' };
    if (match.finished && !match.finished_provisional) return { status: 'CALCULATING', color: 'bg-yellow-500' };
    if (match.finished_provisional) return { status: 'FINISHED', color: 'bg-blue-500' };
    return { status: 'POSTPONED', color: 'bg-red-500' };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches?.map((match) => {
        const { status, color } = getMatchStatus(match);
        
        return (
          <Card 
            key={match.id} 
            className={`p-4 relative cursor-pointer transition-all duration-200 hover:scale-[1.02] ${selectedMatchId === match.id ? 'ring-2 ring-primary' : ''}`}
            onClick={() => onMatchSelect?.(match.id)}
          >
            <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${color}`} />
            
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {format(new Date(match.kickoff_time), 'MMM d, HH:mm')}
                </span>
                <Badge variant="outline">{status}</Badge>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-semibold">{match.team_h.name}</p>
                </div>
                <div className="px-4 text-xl font-bold">
                  {match.started ? `${match.team_h_score ?? 0} - ${match.team_a_score ?? 0}` : 'vs'}
                </div>
                <div className="flex-1 text-right">
                  <p className="font-semibold">{match.team_a.name}</p>
                </div>
              </div>

              {match.started && !match.finished_provisional && (
                <div className="text-center text-sm text-gray-500">
                  {match.minutes}'
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