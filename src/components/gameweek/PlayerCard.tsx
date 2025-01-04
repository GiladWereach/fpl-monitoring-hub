import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Copyright } from "lucide-react";
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
  
  // Calculate total points from breakdown
  const calculateTotalPoints = () => {
    if (!liveData?.points_breakdown) return 0;
    
    const breakdown = liveData.points_breakdown;
    const basePoints = Object.values(breakdown).reduce((sum: number, points: number) => sum + points, 0);
    
    // Apply captain multiplier if applicable
    return isCaptain ? basePoints * 2 : basePoints;
  };

  const points = calculateTotalPoints();
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
      total_points: points,
      points_breakdown: liveData.points_breakdown
    } : 'No live data'
  });

  return (
    <HoverCard>
      <HoverCardTrigger>
        <div 
          className={cn("player-card relative", isExpanded && "player-card-expanded")}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {(isCaptain || isViceCaptain) && (
            <div className="absolute top-1 right-1">
              <Copyright 
                size={16} 
                className={cn(
                  "transition-colors",
                  isCaptain ? "text-[#eaff80]" : "text-gray-400"
                )}
              />
            </div>
          )}
          
          <PlayerStatus player={player} liveData={liveData} />
          
          <div className="relative">
            <p className="player-name truncate">{player?.web_name}</p>
            <div className="points-text">{points}</div>
            <div className="player-position">{getPositionText(player?.element_type)}</div>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-40 bg-secondary/95 backdrop-blur-sm border-accent/20">
        <div className="space-y-2">
          {/* Points Breakdown Section */}
          {liveData?.points_breakdown && (
            <>
              {liveData.points_breakdown.minutes > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/80">Minutes</span>
                  <span className="text-xs font-medium text-foreground">
                    {liveData.minutes}' (+{liveData.points_breakdown.minutes})
                  </span>
                </div>
              )}
              {liveData.points_breakdown.goals > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/80">Goals</span>
                  <span className="text-xs font-medium text-foreground">
                    {liveData.goals_scored} (+{liveData.points_breakdown.goals})
                  </span>
                </div>
              )}
              {liveData.points_breakdown.assists > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/80">Assists</span>
                  <span className="text-xs font-medium text-foreground">
                    {liveData.assists} (+{liveData.points_breakdown.assists})
                  </span>
                </div>
              )}
              {(isGoalkeeper || isDefender || isMidfielder) && liveData.points_breakdown.clean_sheets > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/80">Clean Sheet</span>
                  <span className="text-xs font-medium text-foreground">
                    ✓ (+{liveData.points_breakdown.clean_sheets})
                  </span>
                </div>
              )}
              {liveData.points_breakdown.bonus > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/80">Bonus</span>
                  <span className="text-xs font-medium text-foreground">
                    +{liveData.points_breakdown.bonus}
                  </span>
                </div>
              )}
            </>
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

function getPositionText(elementType: number) {
  switch (elementType) {
    case 1: return 'GK';
    case 2: return 'DEF';
    case 3: return 'MID';
    case 4: return 'FWD';
    default: return '';
  }
}