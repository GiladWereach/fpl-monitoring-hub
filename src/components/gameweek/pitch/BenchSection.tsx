import React from 'react';
import { PlayerCard } from '../PlayerCard';

interface BenchSectionProps {
  getPlayerData: (position: number) => any;
  eventId: number;
}

export function BenchSection({ getPlayerData, eventId }: BenchSectionProps) {
  return (
    <div className="bench-section">
      <h3 className="text-sm font-semibold mb-4">Bench Players</h3>
      <div className="bench-grid">
        {[12, 13, 14, 15].map((position) => {
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
    </div>
  );
}