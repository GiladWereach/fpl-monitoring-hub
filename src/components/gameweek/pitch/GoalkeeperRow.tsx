import React from 'react';
import { PlayerCard } from '../PlayerCard';
import { cn } from "@/lib/utils";

interface GoalkeeperRowProps {
  getPlayerData: (position: number) => any;
  eventId: number;
}

export function GoalkeeperRow({ getPlayerData, eventId }: GoalkeeperRowProps) {
  return (
    <div className={cn(
      "w-full flex items-center justify-center gap-4 gk-row",
      "py-4 md:py-[1.0625em]" // Reduced from py-5 md:py-[1.25em]
    )}>
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
            eventId={eventId}
          />
        );
      })}
    </div>
  );
}