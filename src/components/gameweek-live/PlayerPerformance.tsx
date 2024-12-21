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
import { PlayerPerformanceData, PointsData } from './types';
import { getRowClassName } from './utils/table-utils';

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
        .eq('event_id', gameweek)
        .gt('minutes', 0);

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

  // Query for match details when matchId is provided
  const { data: matchDetails } = useQuery({
    queryKey: ['match-details', matchId],
    enabled: !!matchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fixtures')
        .select(`
          team_h:teams!fk_fixtures_team_h(short_name),
          team_a:teams!fk_fixtures_team_a(short_name)
        `)
        .eq('id', matchId)
        .single();
      
      if (error) throw error;
      return {
        homeTeam: data.team_h.short_name,
        awayTeam: data.team_a.short_name
      };
    }
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
        acc[curr.player_id] = {
          player_id: curr.player_id,
          minutes_points: curr.minutes_points,
          goals_scored_points: curr.goals_scored_points,
          assists_points: curr.assist_points,
          clean_sheet_points: curr.clean_sheet_points,
          goals_conceded_points: curr.goals_conceded_points,
          own_goal_points: curr.own_goal_points,
          penalty_save_points: curr.penalty_save_points,
          penalty_miss_points: curr.penalty_miss_points,
          saves_points: curr.saves_points,
          bonus_points: curr.bonus_points,
          card_points: curr.card_points,
          final_total_points: curr.final_total_points
        };
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
              <TableRow 
                key={perf.id}
                className={getRowClassName(perf, matchId, matchDetails?.homeTeam, matchDetails?.awayTeam)}
              >
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