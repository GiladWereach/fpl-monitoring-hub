import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlayerPerformanceData } from '../types';
import { getRowClassName } from '../utils/table-utils';

interface PerformanceTableProps {
  performances: PlayerPerformanceData[];
  matchId?: number | null;
  homeTeam?: string;
  awayTeam?: string;
}

export const PerformanceTable: React.FC<PerformanceTableProps> = ({
  performances,
  matchId,
  homeTeam,
  awayTeam,
}) => {
  const calculateTotalPoints = (perf: PlayerPerformanceData) => {
    if (!perf.points?.[0]) return 0;
    
    const points = perf.points[0];
    // Use the bonus points from the main performance data as it's more reliable
    return (
      (points.minutes_points || 0) +
      (points.goals_scored_points || 0) +
      (points.assist_points || 0) +
      (points.clean_sheet_points || 0) +
      (points.goals_conceded_points || 0) +
      (points.own_goal_points || 0) +
      (points.penalty_save_points || 0) +
      (points.penalty_miss_points || 0) +
      (points.saves_points || 0) +
      // Use bonus points from the main performance data
      (perf.bonus || 0)
    );
  };

  return (
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
        {performances?.map((perf) => (
          <TableRow 
            key={perf.id}
            className={getRowClassName(perf, matchId, homeTeam, awayTeam)}
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
              {calculateTotalPoints(perf)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};