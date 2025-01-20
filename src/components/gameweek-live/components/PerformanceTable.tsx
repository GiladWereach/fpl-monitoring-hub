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
import { calculateBonusPoints } from '../utils/bonus-utils';

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
  // Group performances by fixture for bonus point calculations
  const performancesByFixture = performances.reduce((acc: { [key: number]: PlayerPerformanceData[] }, curr) => {
    const fixtureId = curr.fixture_id || 0;
    if (!acc[fixtureId]) {
      acc[fixtureId] = [];
    }
    acc[fixtureId].push(curr);
    return acc;
  }, {});

  // Calculate bonus points for each player
  const performancesWithBonus = performances.map(perf => {
    const fixturePerformances = performancesByFixture[perf.fixture_id || 0] || [];
    const bpsValues = fixturePerformances.map(p => ({
      player_id: p.player.id,
      bps: p.bps,
      fixture_id: p.fixture_id || 0,
      minutes: p.minutes
    }));
    
    const calculatedBonus = calculateBonusPoints(
      [{ 
        player_id: perf.player.id, 
        bps: perf.bps, 
        fixture_id: perf.fixture_id || 0,
        minutes: perf.minutes 
      }],
      bpsValues
    );

    return {
      ...perf,
      calculatedBonus
    };
  });

  // Sort performances by total points (including calculated bonus) in descending order
  const sortedPerformances = [...performancesWithBonus].sort((a, b) => {
    const totalA = (a.points_calculation?.final_total_points || a.total_points) + a.calculatedBonus;
    const totalB = (b.points_calculation?.final_total_points || b.total_points) + b.calculatedBonus;
    return totalB - totalA;
  });

  console.log('Performances with calculated bonus:', sortedPerformances.map(p => ({
    player: p.player.web_name,
    bps: p.bps,
    calculatedBonus: p.calculatedBonus,
    points_calculation: p.points_calculation,
    totalPoints: (p.points_calculation?.final_total_points || p.total_points) + p.calculatedBonus
  })));

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
        {sortedPerformances?.map((perf) => (
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
              {(perf.points_calculation?.final_total_points || perf.total_points) + perf.calculatedBonus}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};