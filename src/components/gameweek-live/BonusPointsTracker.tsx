import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';

interface BonusPointsTrackerProps {
  gameweek: number;
  matchId?: number | null;
}

const BonusPointsTracker = ({ gameweek, matchId }: BonusPointsTrackerProps) => {
  const { data: matches } = useQuery({
    queryKey: ['bonus-matches', gameweek, matchId],
    queryFn: async () => {
      console.log('Fetching bonus matches for gameweek:', gameweek, 'match:', matchId);
      const query = supabase
        .from('fixtures')
        .select(`
          id,
          team_h:teams!fk_fixtures_team_h(short_name),
          team_a:teams!fk_fixtures_team_a(short_name),
          started,
          finished,
          finished_provisional
        `)
        .eq('event', gameweek)
        .eq('started', true);

      if (matchId) {
        query.eq('id', matchId);
      }
      
      const { data, error } = await query.order('kickoff_time', { ascending: true });
      if (error) throw error;
      console.log('Fetched bonus matches:', data);
      return data;
    },
    refetchInterval: 60000
  });

  const { data: bpsData, isLoading } = useQuery({
    queryKey: ['bonus-points', gameweek, matchId],
    enabled: !!matches?.length,
    queryFn: async () => {
      console.log('Fetching BPS data for matches:', matches?.map(m => m.id));
      const { data, error } = await supabase
        .from('match_bps_tracking')
        .select(`
          *,
          player:players(
            web_name,
            element_type
          ),
          match:fixtures(
            id,
            team_h:teams!fk_fixtures_team_h(short_name),
            team_a:teams!fk_fixtures_team_a(short_name)
          )
        `)
        .in('match_id', matches?.map(m => m.id) || [])
        .order('bps_score', { ascending: false });
      
      if (error) throw error;
      console.log('Fetched BPS data:', data);
      return data;
    },
    refetchInterval: 60000
  });

  if (isLoading) {
    return <div>Loading bonus points...</div>;
  }

  // Group BPS data by match
  const bpsByMatch = bpsData?.reduce((acc: any, curr) => {
    if (!acc[curr.match_id]) {
      acc[curr.match_id] = [];
    }
    acc[curr.match_id].push(curr);
    return acc;
  }, {});

  const getBonusColor = (bonusPoints: number) => {
    switch (bonusPoints) {
      case 3: return 'bg-yellow-100';
      case 2: return 'bg-gray-100';
      case 1: return 'bg-orange-100';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {matches?.map((match) => (
        <Card key={match.id} className="p-4">
          <h3 className="font-semibold mb-4">
            {match.team_h.short_name} vs {match.team_a.short_name}
          </h3>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">BPS</TableHead>
                <TableHead className="text-right">Bonus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bpsByMatch?.[match.id]?.map((bps: any) => (
                <TableRow 
                  key={bps.id}
                  className={getBonusColor(bps.bonus_points)}
                >
                  <TableCell>{bps.player.web_name}</TableCell>
                  <TableCell className="text-right">{bps.bps_score}</TableCell>
                  <TableCell className="text-right font-bold">
                    {bps.bonus_points}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ))}
    </div>
  );
};

export default BonusPointsTracker;