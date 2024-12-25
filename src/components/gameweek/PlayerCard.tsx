import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

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
    <HoverCard>
      <HoverCardTrigger>
        <div 
          className={cn("player-card", isExpanded && "player-card-expanded")}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isCaptain && <div className="captain-ribbon" />}
          {isViceCaptain && <div className="vice-captain-ribbon" />}
          
          <div className="relative">
            <p className="player-name truncate">{player?.web_name}</p>
            <div className="points-text">{finalPoints}</div>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-32 bg-secondary/95 backdrop-blur-sm border-accent/20">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-foreground/80">Minutes</span>
            <span className="text-xs font-medium text-foreground">{liveData?.minutes || 0}'</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-foreground/80">Goals</span>
            <span className="text-xs font-medium text-foreground">{liveData?.goals_scored || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-foreground/80">Assists</span>
            <span className="text-xs font-medium text-foreground">{liveData?.assists || 0}</span>
          </div>
          {liveData?.bonus > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-foreground/80">Bonus</span>
              <span className="text-xs font-medium text-foreground">{liveData.bonus}</span>
            </div>
          )}
          {(isCaptain || isViceCaptain) && (
            <div className="mt-2 pt-2 border-t border-accent/20">
              <span className="text-xs font-medium text-accent">
                {isCaptain ? 'Captain (2x points)' : 'Vice Captain'}
              </span>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}