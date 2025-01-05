import React from 'react';
import { Card } from '@/components/ui/card';
import { PlayerCard } from './PlayerCard';

interface BenchPlayersProps {
  benchPlayers: number[];
  getPlayerData: (position: number) => any;
  eventId: number;
}

export function BenchPlayers({ benchPlayers, getPlayerData, eventId }: BenchPlayersProps) {
  return (
    <Card className="glass-card p-4">
      <h3 className="text-sm font-semibold mb-4">Bench Players</h3>
      <div className="grid grid-cols-4 gap-4">
        {benchPlayers.map((position) => {
          const playerData = getPlayerData(position);
          if (!playerData) return null;
          
          return (
            <PlayerCard
              key={position}
              player={playerData}
              isCaptain={playerData.isCaptain}
              isViceCaptain={playerData.isViceCaptain}
              liveData={playerData.liveData}
              eventId={eventId}
            />
          );
        })}
      </div>
    </Card>
  );
}