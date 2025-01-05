import React from 'react';
import { PlayerCard } from '../PlayerCard';

interface GoalkeeperRowProps {
  getPlayerData: (position: number) => any;
  eventId: number;
}

export function GoalkeeperRow({ getPlayerData, eventId }: GoalkeeperRowProps) {
  return (
    <div className="gk-row">
      {[1].map(position => {
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