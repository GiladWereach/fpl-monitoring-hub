import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Copyright } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { PlayerStatus } from './PlayerStatus';
import { PointsBreakdown } from './components/PointsBreakdown';

interface PlayerCardProps {
  player: any;
  isCaptain: boolean;
  isViceCaptain: boolean;
  liveData?: any;
  fixture_id?: number;
}

export function PlayerCard({ player, isCaptain, isViceCaptain, liveData, fixture_id }: PlayerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  console.log(`PlayerCard render for ${player?.web_name}:`, {
    player_id: player?.id,
    is_captain: isCaptain,
    live_data: liveData ? {
      total_points: liveData.points?.[0]?.final_total_points,
      minutes: liveData.minutes,
      goals: liveData.goals_scored,
      assists: liveData.assists,
      bonus: liveData.bonus,
      clean_sheets: liveData.clean_sheets,
    } : 'No live data'
  });

  // Calculate points from live data, using final_total_points from the points array
  const points = liveData?.points?.[0]?.final_total_points ? 
    (isCaptain ? liveData.points[0].final_total_points * 2 : liveData.points[0].final_total_points) 
    : 0;

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
          
          <div className="relative">
            <p className="player-name truncate">{player?.web_name}</p>
            <div className="points-text">{points}</div>
            <div className="player-position">{getPositionText(player?.element_type)}</div>
          </div>

          <PlayerStatus 
            player={player} 
            liveData={liveData}
            fixture_id={fixture_id}
          />
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-40 bg-secondary/95 backdrop-blur-sm border-accent/20">
        <PointsBreakdown 
          liveData={liveData}
          isCaptain={isCaptain}
          isViceCaptain={isViceCaptain}
        />
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