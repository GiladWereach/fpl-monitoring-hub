import React from 'react';
import { PlayerCard } from '../PlayerCard';
import { cn } from "@/lib/utils";

interface BenchSectionProps {
  getPlayerData: (position: number) => any;
  eventId: number;
}

export function BenchSection({ getPlayerData, eventId }: BenchSectionProps) {
  return (
    <div className="fpl-bench-section">
      <div className={cn(
        "w-full grid grid-cols-4 gap-8",
        "md:flex md:items-center md:justify-center md:gap-8"
      )}>
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