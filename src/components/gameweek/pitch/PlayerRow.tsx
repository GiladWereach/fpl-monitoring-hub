import React from 'react';
import { PlayerCard } from '../PlayerCard';

interface PlayerRowProps {
  positions: number[];
  getPlayerData: (position: number) => any;
  eventId: number;
  className: string;
}

export function PlayerRow({ positions, getPlayerData, eventId, className }: PlayerRowProps) {
  return (
    <div className={className}>
      {positions.map(position => {
        const player = getPlayerData(position);
        if (!player) return null;
        return (
          <PlayerCard 
            key={position}
            player={player}
            isCaptain={player.isCaptain}
            isViceCaptain={player.isViceCaptain}
            liveData={player.liveData}
            fixture_id={player.fixture_id}
            eventId={eventId}
          />
        );
      })}
    </div>
  );
}