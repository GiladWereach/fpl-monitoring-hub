import React from 'react';
import { PlayerCard } from '../PlayerCard';
import { cn } from "@/lib/utils";

interface PlayerRowProps {
  positions: number[];
  getPlayerData: (position: number) => any;
  eventId: number;
  className: string;
}

export function PlayerRow({ positions, getPlayerData, eventId, className }: PlayerRowProps) {
  return (
    <div className={cn(
      "w-full flex items-center justify-center gap-4",
      "py-4 md:py-[1.0625em]", // Reduced from py-5 md:py-[1.25em]
      className
    )}>
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
            eventId={eventId}
          />
        );
      })}
    </div>
  );
}