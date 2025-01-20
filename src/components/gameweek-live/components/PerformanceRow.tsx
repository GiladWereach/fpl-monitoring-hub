import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { PlayerPerformanceData } from '../types';
import { getRowClassName } from '../utils/table-utils';

interface PerformanceRowProps {
  performance: PlayerPerformanceData & { calculatedBonus: number };
  matchId?: number | null;
  homeTeam?: string;
  awayTeam?: string;
}

export const PerformanceRow: React.FC<PerformanceRowProps> = ({
  performance: perf,
  matchId,
  homeTeam,
  awayTeam,
}) => {
  const totalPoints = (perf.points_calculation?.final_total_points || perf.total_points) + perf.calculatedBonus;

  return (
    <TableRow 
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
        {totalPoints}
      </TableCell>
    </TableRow>
  );
};