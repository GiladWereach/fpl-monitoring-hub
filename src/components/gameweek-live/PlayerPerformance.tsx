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

interface PlayerPerformanceProps {
  gameweek: number;
}

const PlayerPerformance = ({ gameweek }: PlayerPerformanceProps) => {
  const [search, setSearch] = useState('');

  const { data: performances, isLoading } = useQuery({
    queryKey: ['player-performances', gameweek],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_player_performance')
        .select(`
          *,
          player:players(
            id,
            first_name,
            second_name,
            web_name,
            element_type
          ),
          team:teams(
            short_name
          ),
          fixture:fixtures(
            id,
            started,
            finished,
            event
          )
        `)
        .eq('fixture.event', gameweek)
        .order('total_points', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000 // Refetch every minute
  });

  if (isLoading) {
    return <div>Loading performances...</div>;
  }

  const filteredPerformances = performances?.filter(p => 
    p.player.web_name.toLowerCase().includes(search.toLowerCase()) ||
    p.team.short_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search players..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

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
                  {perf.is_substitute && <span className="text-gray-500"> (Sub)</span>}
                </TableCell>
                <TableCell>{perf.team.short_name}</TableCell>
                <TableCell className="text-right">{perf.minutes_played}</TableCell>
                <TableCell className="text-right">{perf.goals_scored}</TableCell>
                <TableCell className="text-right">{perf.assists}</TableCell>
                <TableCell className="text-right">{perf.clean_sheet ? '1' : '0'}</TableCell>
                <TableCell className="text-right">{perf.goals_conceded}</TableCell>
                <TableCell className="text-right">{perf.own_goals}</TableCell>
                <TableCell className="text-right">{perf.penalties_saved}</TableCell>
                <TableCell className="text-right">{perf.penalties_missed}</TableCell>
                <TableCell className="text-right">{perf.yellow_cards}</TableCell>
                <TableCell className="text-right">{perf.red_cards}</TableCell>
                <TableCell className="text-right">{perf.saves}</TableCell>
                <TableCell className="text-right">{perf.bps}</TableCell>
                <TableCell className="text-right font-bold">{perf.total_points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PlayerPerformance;