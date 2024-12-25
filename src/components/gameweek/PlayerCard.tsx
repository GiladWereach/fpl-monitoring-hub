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
      <HoverCardContent className="w-64 bg-secondary/95 backdrop-blur-sm border-accent/20">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground/60">Minutes</span>
            <span className="text-sm font-medium">{liveData?.minutes || 0}'</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground/60">Goals</span>
            <span className="text-sm font-medium">{liveData?.goals_scored || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground/60">Assists</span>
            <span className="text-sm font-medium">{liveData?.assists || 0}</span>
          </div>
          {liveData?.bonus > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/60">Bonus</span>
              <span className="text-sm font-medium">{liveData.bonus}</span>
            </div>
          )}
          {(isCaptain || isViceCaptain) && (
            <div className="mt-2 pt-2 border-t border-accent/20">
              <span className="text-sm font-medium text-accent">
                {isCaptain ? 'Captain (2x points)' : 'Vice Captain'}
              </span>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}