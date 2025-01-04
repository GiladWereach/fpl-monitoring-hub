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
  
  // Calculate total points from raw points and bonus
  const calculateTotalPoints = () => {
    if (!liveData) return 0;
    
    // Get raw points from points calculation
    const rawPoints = liveData.points_breakdown ? 
      Object.values(liveData.points_breakdown).reduce((sum: number, points: number) => sum + points, 0) 
      : 0;
    
    // Add bonus points if available
    const bonusPoints = liveData.bonus || 0;
    const totalPoints = rawPoints + bonusPoints;
    
    // Apply captain multiplier if applicable
    return isCaptain ? totalPoints * 2 : totalPoints;
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
      points_breakdown: liveData.points_breakdown,
      bonus: liveData.bonus,
      bps: liveData.bps
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
              {liveData.minutes > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/80">Minutes</span>
                  <span className="text-xs font-medium text-foreground">
                    {liveData.minutes}' (+{liveData.points_breakdown.minutes})
                  </span>
                </div>
              )}
              {liveData.goals_scored > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/80">Goals</span>
                  <span className="text-xs font-medium text-foreground">
                    {liveData.goals_scored} (+{liveData.points_breakdown.goals_scored})
                  </span>
                </div>
              )}
              {liveData.assists > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/80">Assists</span>
                  <span className="text-xs font-medium text-foreground">
                    {liveData.assists} (+{liveData.points_breakdown.assists})
                  </span>
                </div>
              )}
              {(isGoalkeeper || isDefender || isMidfielder) && liveData.clean_sheets > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/80">Clean Sheet</span>
                  <span className="text-xs font-medium text-foreground">
                    ✓ (+{liveData.points_breakdown.clean_sheets})
                  </span>
                </div>
              )}
              {liveData.saves > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/80">Saves</span>
                  <span className="text-xs font-medium text-foreground">
                    {liveData.saves} (+{liveData.points_breakdown.saves})
                  </span>
                </div>
              )}
              {liveData.penalties_saved > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/80">Penalties Saved</span>
                  <span className="text-xs font-medium text-foreground">
                    {liveData.penalties_saved} (+{liveData.points_breakdown.penalties_saved})
                  </span>
                </div>
              )}
              {liveData.penalties_missed > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/80">Penalties Missed</span>
                  <span className="text-xs font-medium text-foreground">
                    {liveData.penalties_missed} ({liveData.points_breakdown.penalties_missed})
                  </span>
                </div>
              )}
              {liveData.own_goals > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/80">Own Goals</span>
                  <span className="text-xs font-medium text-foreground">
                    {liveData.own_goals} ({liveData.points_breakdown.own_goals})
                  </span>
                </div>
              )}
              {liveData.yellow_cards > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/80">Yellow Cards</span>
                  <span className="text-xs font-medium text-foreground">
                    {liveData.yellow_cards} ({liveData.points_breakdown.yellow_cards})
                  </span>
                </div>
              )}
              {liveData.red_cards > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/80">Red Cards</span>
                  <span className="text-xs font-medium text-foreground">
                    {liveData.red_cards} ({liveData.points_breakdown.red_cards})
                  </span>
                </div>
              )}
              {liveData.bonus > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/80">Bonus</span>
                  <span className="text-xs font-medium text-foreground">
                    +{liveData.bonus}
                  </span>
                </div>
              )}
              {liveData.bps > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/80">BPS</span>
                  <span className="text-xs font-medium text-foreground">
                    {liveData.bps}
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