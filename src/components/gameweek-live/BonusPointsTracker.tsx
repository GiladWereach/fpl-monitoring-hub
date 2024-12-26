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

const calculateBonusPoints = (bps: number, allBpsInFixture: number[]): number => {
  // Sort BPS in descending order and get unique values
  const uniqueBps = [...new Set(allBpsInFixture)].sort((a, b) => b - a);
  
  // Get index of current BPS in unique sorted array
  const bpsIndex = uniqueBps.indexOf(bps);
  
  // If not in top 3 unique BPS values, no bonus points
  if (bpsIndex >= 3) return 0;
  
  // Assign bonus points based on position in unique BPS values
  // If same BPS, they get the same points
  switch (bpsIndex) {
    case 0: return 3; // Highest unique BPS
    case 1: return 2; // Second highest unique BPS
    case 2: return 1; // Third highest unique BPS
    default: return 0;
  }
};

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
        .from('gameweek_live_performance')
        .select(`
          id,
          bps,
          bonus,
          player:players(
            web_name,
            element_type,
            team_id
          ),
          fixture:fixtures!inner(
            id,
            team_h:teams!fk_fixtures_team_h(short_name),
            team_a:teams!fk_fixtures_team_a(short_name)
          )
        `)
        .in('fixture_id', matches?.map(m => m.id) || [])
        .gt('minutes', 0) // Only players with minutes > 0
        .order('bps', { ascending: false });
      
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
    if (!acc[curr.fixture.id]) {
      acc[curr.fixture.id] = [];
    }
    acc[curr.fixture.id].push(curr);
    return acc;
  }, {});

  const getBonusColor = (bonusPoints: number) => {
    switch (bonusPoints) {
      case 3: return 'bg-yellow-100 text-yellow-900'; // Darker text for contrast
      case 2: return 'bg-gray-100 text-gray-900';     // Darker text for contrast
      case 1: return 'bg-orange-100 text-orange-900'; // Darker text for contrast
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {matches?.map((match) => {
        const matchBpsValues = bpsByMatch?.[match.id]?.map((p: any) => p.bps) || [];
        
        return (
          <Card key={match.id} className="p-4">
            <h3 className="font-semibold mb-4">
              {match.team_h.short_name} vs {match.team_a.short_name}
              {match.finished_provisional && <span className="text-sm text-gray-500 ml-2">(Provisional)</span>}
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
                {bpsByMatch?.[match.id]?.map((bps: any) => {
                  const calculatedBonus = calculateBonusPoints(bps.bps, matchBpsValues);
                  return (
                    <TableRow 
                      key={bps.id}
                      className={getBonusColor(calculatedBonus)}
                    >
                      <TableCell className="font-medium">{bps.player.web_name}</TableCell>
                      <TableCell className="text-right">{bps.bps}</TableCell>
                      <TableCell className="text-right font-bold">
                        {calculatedBonus}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        );
      })}
    </div>
  );
};

export default BonusPointsTracker;
