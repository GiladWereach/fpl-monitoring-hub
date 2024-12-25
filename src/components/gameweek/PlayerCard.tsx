import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { PlayerStatus } from './PlayerStatus';

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
  const isGoalkeeper = player?.element_type === 1;
  const isDefender = player?.element_type === 2;
  const isMidfielder = player?.element_type === 3;

  console.log('PlayerCard Data:', {
    player_id: player?.id,
    web_name: player?.web_name,
    status: player?.status,
    chance_of_playing: player?.chance_of_playing_this_round,
    live_data: liveData ? {
      minutes: liveData.minutes,
      finished: liveData.finished,
      total_points: liveData.total_points
    } : 'No live data'
  });

  const getPositionText = (elementType: number) => {
    switch (elementType) {
      case 1: return 'GK';
      case 2: return 'DEF';
      case 3: return 'MID';
      case 4: return 'FWD';
      default: return '';
    }
  };

  return (
    <HoverCard>
      <HoverCardTrigger>
        <div 
          className={cn("player-card", isExpanded && "player-card-expanded")}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isCaptain && <div className="captain-ribbon" />}
          {isViceCaptain && <div className="vice-captain-ribbon" />}
          
          <PlayerStatus player={player} liveData={liveData} />
          
          <div className="relative">
            <p className="player-name truncate">{player?.web_name}</p>
            <div className="points-text">{finalPoints}</div>
            <div className="player-position">{getPositionText(player?.element_type)}</div>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-40 bg-secondary/95 backdrop-blur-sm border-accent/20">
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
          {(isGoalkeeper || isDefender || isMidfielder) && liveData?.clean_sheets > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-foreground/80">Clean Sheet</span>
              <span className="text-xs font-medium text-foreground">✓</span>
            </div>
          )}
          {isGoalkeeper && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-foreground/80">Saves</span>
              <span className="text-xs font-medium text-foreground">{liveData?.saves || 0}</span>
            </div>
          )}
          {(liveData?.yellow_cards > 0 || liveData?.red_cards > 0) && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-foreground/80">Cards</span>
              <span className="text-xs font-medium text-foreground">
                {liveData?.yellow_cards > 0 && <span className="text-yellow-400">■ </span>}
                {liveData?.red_cards > 0 && <span className="text-red-500">■</span>}
              </span>
            </div>
          )}
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
