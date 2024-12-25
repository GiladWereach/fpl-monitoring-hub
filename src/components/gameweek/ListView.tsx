import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ListViewProps {
  teamSelection?: any;
  players?: any[];
  liveData?: any[];
}

export function ListView({ teamSelection, players, liveData }: ListViewProps) {
  const getPlayerData = (pick: any) => {
    const player = players?.find(p => p.id === pick.element);
    const playerLiveData = liveData?.find(d => d.player_id === pick.element);
    const points = playerLiveData?.total_points || 0;
    
    return {
      ...player,
      points: pick.is_captain ? points * 2 : points,
      liveData: playerLiveData
    };
  };

  return (
    <Card className="glass-card p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Points</TableHead>
            <TableHead>Minutes</TableHead>
            <TableHead>G+A</TableHead>
            <TableHead>Bonus</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamSelection?.picks.map((pick: any) => {
            const playerData = getPlayerData(pick);
            if (!playerData) return null;
            
            return (
              <TableRow key={pick.element}>
                <TableCell>
                  {playerData.web_name}
                  {pick.is_captain && <span className="ml-1 text-[#3DFF9A]">(C)</span>}
                  {pick.is_vice_captain && <span className="ml-1 text-[#3DFF9A]">(V)</span>}
                </TableCell>
                <TableCell>{playerData.element_type}</TableCell>
                <TableCell>{playerData.points}</TableCell>
                <TableCell>{playerData.liveData?.minutes || 0}</TableCell>
                <TableCell>
                  {(playerData.liveData?.goals_scored || 0) + (playerData.liveData?.assists || 0)}
                </TableCell>
                <TableCell>{playerData.liveData?.bonus || 0}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}