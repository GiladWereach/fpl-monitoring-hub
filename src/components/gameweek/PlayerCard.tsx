import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  player: any;
  isCaptain: boolean;
  isViceCaptain: boolean;
  liveData?: any;
}

export function PlayerCard({ player, isCaptain, isViceCaptain, liveData }: PlayerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const points = liveData?.total_points || 0;
  const finalPoints = isCaptain ? points * 2 : points;

  return (
    <div 
      className={cn("player-card", isExpanded && "player-card-expanded")}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {isCaptain && <div className="captain-ribbon" />}
      {isViceCaptain && <div className="vice-captain-ribbon" />}
      
      <div className="relative">
        <p className="text-sm font-medium text-foreground truncate">{player?.web_name}</p>
        <div className="text-xs mt-1 text-accent">{finalPoints} pts</div>
      </div>
      
      {isExpanded && liveData && (
        <div className="mt-2 space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Minutes</span>
            <span>{liveData.minutes}</span>
          </div>
          {liveData.goals_scored > 0 && (
            <div className="flex justify-between">
              <span>Goals</span>
              <span>{liveData.goals_scored}</span>
            </div>
          )}
          {liveData.assists > 0 && (
            <div className="flex justify-between">
              <span>Assists</span>
              <span>{liveData.assists}</span>
            </div>
          )}
          {liveData.bonus > 0 && (
            <div className="flex justify-between">
              <span>Bonus</span>
              <span>{liveData.bonus}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}