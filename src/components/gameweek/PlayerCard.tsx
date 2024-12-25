import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  player: any;
  isCaptain: boolean;
  isViceCaptain: boolean;
  liveData?: any;
  teamColor?: string;
}

export function PlayerCard({ player, isCaptain, isViceCaptain, liveData, teamColor = 'accent' }: PlayerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const points = liveData?.total_points || 0;
  const finalPoints = isCaptain ? points * 2 : points;

  return (
    <div className="player-card" onClick={() => setIsExpanded(!isExpanded)}>
      <div className={cn(
        "relative",
        isExpanded && "player-card-expanded"
      )}>
        <p className="text-sm font-medium text-foreground">{player?.web_name}</p>
        {isCaptain && <span className="text-xs text-accent">(C)</span>}
        {isViceCaptain && <span className="text-xs text-accent">(V)</span>}
        <div className="text-xs mt-1 text-accent">{finalPoints} pts</div>
        <div className="flex items-center justify-center mt-1">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-accent/60" />
          ) : (
            <ChevronDown className="h-4 w-4 text-accent/60" />
          )}
        </div>
      </div>
      
      {isExpanded && liveData && (
        <div className="mt-2 space-y-2 border-t border-accent/20 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-foreground/60">Minutes</span>
            <span className="text-xs font-medium">{liveData.minutes}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-foreground/60">Goals</span>
            <span className="text-xs font-medium">{liveData.goals_scored}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-foreground/60">Assists</span>
            <span className="text-xs font-medium">{liveData.assists}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-foreground/60">Clean Sheet</span>
            <span className="text-xs font-medium">{liveData.clean_sheets ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-foreground/60">Bonus</span>
            <span className="text-xs font-medium">{liveData.bonus}</span>
          </div>
        </div>
      )}
    </div>
  );
}