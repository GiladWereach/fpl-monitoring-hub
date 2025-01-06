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
    loading: pointsLoading,
    raw_points: pointsData?.final_total_points,
    captain_multiplier: isCaptain ? 2 : 1
  });

  // Calculate points with captain multiplier
  const points = pointsData?.final_total_points 
    ? (isCaptain ? pointsData.final_total_points * 2 : pointsData.final_total_points)
    : 0;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div 
          className={cn(
            "relative w-full max-w-[120px]",
            "p-4 rounded-lg transition-all duration-200",
            "bg-secondary/95 backdrop-blur-sm border border-accent/20",
            "hover:bg-accent/10 hover:scale-105 cursor-pointer",
            "flex flex-col items-center justify-center gap-3",
            "shadow-lg hover:shadow-xl",
            "animate-fade-in",
            isExpanded && "bg-accent/10"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
          role="button"
          tabIndex={0}
          aria-label={`${player?.web_name} - ${points} points`}
        >
          {(isCaptain || isViceCaptain) && (
            <div className="absolute top-2 right-2">
              <Copyright 
                size={16} 
                className={cn(
                  "transition-colors",
                  isCaptain ? "text-[#eaff80] drop-shadow-glow" : "text-gray-400"
                )}
                aria-label={isCaptain ? "Captain" : "Vice Captain"}
              />
            </div>
          )}
          
          <p className="text-sm font-semibold truncate text-center w-full text-foreground/90">
            {player?.web_name}
          </p>
          
          <div className="text-xl font-bold text-[#3DFF9A]">
            {pointsLoading ? '...' : points}
          </div>

          <PlayerStatus 
            player={player} 
            liveData={liveData}
            fixture_id={fixture_id}
          />
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-[120px] bg-secondary/95 backdrop-blur-sm border-accent/20 animate-fade-in"
        side="right"
      >
        <PointsBreakdown 
          pointsData={pointsData}
          isCaptain={isCaptain}
          isViceCaptain={isViceCaptain}
        />
      </HoverCardContent>
    </HoverCard>
  );
}