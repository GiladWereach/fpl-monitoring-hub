import React from 'react';
import { Card } from '@/components/ui/card';
import { PlayerCard } from './PlayerCard';

interface BenchPlayersProps {
  benchPlayers: number[];
  getPlayerData: (position: number) => any;
}

export function BenchPlayers({ benchPlayers, getPlayerData }: BenchPlayersProps) {
  return (
    <Card className="glass-card p-4">
      <h3 className="text-sm font-semibold mb-4">Bench Players</h3>
      <div className="grid grid-cols-2 gap-4">
        {benchPlayers.map((position) => {
          const player = getPlayerData({ position, element: player?.id });
          if (!player) return null;
          
          return (
            <PlayerCard
              key={position}
              player={player}
              isCaptain={false}
              isViceCaptain={false}
              liveData={player.liveData}
            />
          );
        })}
      </div>
    </Card>
  );
}