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
import { usePlayerPoints } from '@/hooks/usePlayerPoints';

interface PlayerCardProps {
  player: any;
  isCaptain: boolean;
  isViceCaptain: boolean;
  liveData?: any;
  fixture_id?: number;
  eventId: number;
}

export function PlayerCard({ 
  player, 
  isCaptain, 
  isViceCaptain, 
  liveData, 
  fixture_id,
  eventId 
}: PlayerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data: pointsData, isLoading: pointsLoading } = usePlayerPoints(player?.id, eventId);
  
  console.log(`PlayerCard render for ${player?.web_name}:`, {
    player_id: player?.id,
    is_captain: isCaptain,
    points_data: pointsData,
    loading: pointsLoading
  });

  const basePoints = pointsData?.final_total_points ?? 0;
  const points = isCaptain ? basePoints * 2 : basePoints;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div 
          className={cn(
            "relative w-full p-3 rounded-lg transition-all duration-200",
            "bg-secondary/90 backdrop-blur-sm border border-accent/20",
            "hover:bg-accent/10 hover:scale-105 cursor-pointer",
            "flex flex-col items-center justify-center gap-1",
            isExpanded && "bg-accent/10"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
          role="button"
          tabIndex={0}
          aria-label={`${player?.web_name} - ${points} points`}
        >
          {(isCaptain || isViceCaptain) && (
            <div className="absolute top-1 right-1">
              <Copyright 
                size={16} 
                className={cn(
                  "transition-colors",
                  isCaptain ? "text-[#eaff80]" : "text-gray-400"
                )}
                aria-label={isCaptain ? "Captain" : "Vice Captain"}
              />
            </div>
          )}
          
          <p className="text-sm font-medium truncate text-center">
            {player?.web_name}
          </p>
          
          <div className="text-xl font-bold text-accent">
            {pointsLoading ? '...' : points}
          </div>
          
          <div className="text-xs text-accent/80">
            {getPositionText(player?.element_type)}
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
          pointsData={pointsData}
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