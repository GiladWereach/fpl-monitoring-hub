import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { calculateTotalPoints, calculateBenchPoints } from './utils/points-calculator';
import { PlayerPerformanceData } from '@/components/gameweek-live/types';
import { PlayerStatus } from './PlayerStatus';

interface ListViewProps {
  teamSelection?: any;
  players?: any[];
  liveData?: PlayerPerformanceData[];
}

const getPositionName = (elementType: number) => {
  switch (elementType) {
    case 1:
      return 'GK';
    case 2:
      return 'DEF';
    case 3:
      return 'MID';
    case 4:
      return 'FWD';
    default:
      return '';
  }
};

export function ListView({ teamSelection, players, liveData }: ListViewProps) {
  const getPlayerData = (pick: any) => {
    if (!pick || !players) {
      console.log('Missing pick or players data:', { pick, playersLength: players?.length });
      return null;
    }

    const player = players.find(p => p.id === pick.element);
    if (!player) {
      console.log('Player not found:', { pickElement: pick.element });
      return null;
    }

    const playerLiveData = liveData?.find(d => d.player?.id === pick.element);
    
    // Calculate points including bonus points if available
    const basePoints = playerLiveData?.points_calculation?.final_total_points || 0;
    const points = pick.is_captain ? basePoints * 2 : basePoints;
    
    console.log('ListView player data:', {
      player: player.web_name,
      liveData: playerLiveData,
      basePoints,
      isCaptain: pick.is_captain,
      finalPoints: points
    });
    
    return {
      ...player,
      points,
      liveData: playerLiveData
    };
  };

  // Calculate points for starting 11 and bench separately
  const totalPoints = calculateTotalPoints(teamSelection?.picks || [], getPlayerData);
  const benchPoints = calculateBenchPoints(teamSelection?.picks || [], getPlayerData);

  if (!teamSelection?.picks) {
    console.log('No team selection data available');
    return (
      <Card className="glass-card p-6">
        <div>Loading team data...</div>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-6">
      <div className="mb-4 space-y-2">
        <h2 className="text-xl font-bold">Total Points: {totalPoints}</h2>
        <p className="text-sm text-foreground/60">Bench Points: {benchPoints}</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead>Position</TableHead>
            <TableHead className="text-right">Points</TableHead>
            <TableHead className="text-right">Minutes</TableHead>
            <TableHead className="text-right">G+A</TableHead>
            <TableHead className="text-right">Bonus</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamSelection.picks.map((pick: any) => {
            const playerData = getPlayerData(pick);
            if (!playerData) return null;
            
            const isSub = pick.position > 11;
            
            return (
              <TableRow key={pick.element} className="h-10">
                <TableCell className="py-2 relative">
                  <PlayerStatus 
                    player={playerData} 
                    liveData={playerData.liveData}
                  />
                  <span className="ml-6">
                    {playerData.web_name}
                    {pick.is_captain && <span className="ml-1 text-[#3DFF9A]">(C)</span>}
                    {pick.is_vice_captain && <span className="ml-1 text-[#3DFF9A]">(V)</span>}
                    {isSub && <span className="ml-1 text-gray-500">(Sub)</span>}
                  </span>
                </TableCell>
                <TableCell className="py-2">{getPositionName(playerData.element_type)}</TableCell>
                <TableCell className="text-right py-2">{playerData.points}</TableCell>
                <TableCell className="text-right py-2">{playerData.liveData?.minutes || 0}</TableCell>
                <TableCell className="text-right py-2">
                  {(playerData.liveData?.goals_scored || 0) + (playerData.liveData?.assists || 0)}
                </TableCell>
                <TableCell className="text-right py-2">{playerData.liveData?.points_calculation?.bonus_points || 0}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}