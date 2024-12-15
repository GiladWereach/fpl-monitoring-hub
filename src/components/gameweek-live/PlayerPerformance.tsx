import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface PlayerPerformanceData {
  id: number;
  assists: number;
  bonus: number;
  bps: number;
  clean_sheets: number;
  goals_scored: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  minutes: number;
  player: {
    id: number;
    first_name: string;
    second_name: string;
    web_name: string;
    element_type: number;
    team: {
      short_name: string;
    };
  };
}

interface PointsData {
  player_id: number;
  minutes_points: number;
  goals_scored_points: number;
  assists_points: number;
  clean_sheet_points: number;
  goals_conceded_points: number;
  own_goal_points: number;
  penalty_save_points: number;
  penalty_miss_points: number;
  saves_points: number;
  bonus_points: number;
  card_points: number;
  final_total_points: number;
}

const PlayerPerformance = ({ gameweek, matchId }: { gameweek: number; matchId?: number | null }) => {
  const [search, setSearch] = useState('');

  // Query for player performances
  const { data: performances, isLoading: performancesLoading } = useQuery({
    queryKey: ['player-performances', gameweek, matchId],
    queryFn: async () => {
      console.log('Fetching performances for gameweek:', gameweek, 'match:', matchId);
      const query = supabase
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
        .eq('event_id', gameweek);

      if (matchId) {
        query.eq('fixture_id', matchId);
      }
      
      const { data, error } = await query.order('total_points', { ascending: false });
      if (error) throw error;
      console.log('Fetched performances:', data);
      return data as unknown as PlayerPerformanceData[];
    },
    refetchInterval: 60000
  });

  // Query for points calculations
  const { data: pointsData, isLoading: pointsLoading } = useQuery({
    queryKey: ['points-calculations', gameweek],
    enabled: !!performances?.length,
    queryFn: async () => {
      console.log('Fetching points calculations for gameweek:', gameweek);
      const { data, error } = await supabase
        .from('player_points_calculation')
        .select('*')
        .eq('event_id', gameweek);
      
      if (error) throw error;
      console.log('Fetched points calculations:', data);
      
      // Convert array to map for easier lookup
      return data.reduce((acc: Record<number, PointsData>, curr) => {
        acc[curr.player_id] = curr;
        return acc;
      }, {});
    },
    refetchInterval: 60000
  });

  if (performancesLoading || pointsLoading) {
    return <div>Loading performances...</div>;
  }

  const filteredPerformances = performances?.filter(p => 
    p.player.web_name.toLowerCase().includes(search.toLowerCase()) ||
    p.player.team.short_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Badge variant="outline">
          {matchId ? 'Showing match details' : 'Showing all matches'}
        </Badge>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-right">Mins</TableHead>
              <TableHead className="text-right">G</TableHead>
              <TableHead className="text-right">A</TableHead>
              <TableHead className="text-right">CS</TableHead>
              <TableHead className="text-right">GC</TableHead>
              <TableHead className="text-right">OG</TableHead>
              <TableHead className="text-right">PS</TableHead>
              <TableHead className="text-right">PM</TableHead>
              <TableHead className="text-right">YC</TableHead>
              <TableHead className="text-right">RC</TableHead>
              <TableHead className="text-right">S</TableHead>
              <TableHead className="text-right">BPS</TableHead>
              <TableHead className="text-right">Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPerformances?.map((perf) => (
              <TableRow key={perf.id}>
                <TableCell>
                  {perf.player.web_name}
                  {perf.minutes < 1 && <span className="text-gray-500"> (Sub)</span>}
                </TableCell>
                <TableCell>{perf.player.team.short_name}</TableCell>
                <TableCell className="text-right">{perf.minutes}</TableCell>
                <TableCell className="text-right">{perf.goals_scored}</TableCell>
                <TableCell className="text-right">{perf.assists}</TableCell>
                <TableCell className="text-right">{perf.clean_sheets ? '1' : '0'}</TableCell>
                <TableCell className="text-right">{perf.goals_conceded}</TableCell>
                <TableCell className="text-right">{perf.own_goals}</TableCell>
                <TableCell className="text-right">{perf.penalties_saved}</TableCell>
                <TableCell className="text-right">{perf.penalties_missed}</TableCell>
                <TableCell className="text-right">{perf.yellow_cards}</TableCell>
                <TableCell className="text-right">{perf.red_cards}</TableCell>
                <TableCell className="text-right">{perf.saves}</TableCell>
                <TableCell className="text-right">{perf.bps}</TableCell>
                <TableCell className="text-right font-bold">
                  {pointsData?.[perf.player.id]?.final_total_points ?? 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PlayerPerformance;