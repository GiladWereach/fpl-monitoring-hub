import React from 'react';
import { Table, TableBody } from '@/components/ui/table';
import { PlayerPerformanceData } from '../types';
import { calculateBonusPoints } from '../utils/bonus-utils';
import { TableHeader } from './TableHeader';
import { PerformanceRow } from './PerformanceRow';

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

  // Sort performances by total points in descending order
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
      <TableHeader />
      <TableBody>
        {sortedPerformances?.map((perf) => (
          <PerformanceRow
            key={perf.id}
            performance={perf}
            matchId={matchId}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
        ))}
      </TableBody>
    </Table>
  );
};