import React from 'react';
import { cn } from "@/lib/utils";
import { Copyright, Loader2 } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { PlayerStatus } from './PlayerStatus';
import { PointsBreakdown } from './components/PointsBreakdown';
import { PlayerPerformanceData } from '@/components/gameweek-live/types';
import { useToast } from '@/hooks/use-toast';

interface PlayerCardProps {
  player: any;
  isCaptain: boolean;
  isViceCaptain: boolean;
  liveData?: PlayerPerformanceData;
  fixture_id?: number;
  eventId: number;
  totalPoints?: number;
  inPlay?: boolean;
}

export function PlayerCard({ 
  player, 
  isCaptain, 
  isViceCaptain, 
  liveData,
  fixture_id,
  eventId,
  totalPoints = 0,
  inPlay = false
}: PlayerCardProps) {
  const { toast } = useToast();

  console.log('PlayerCard render for:', player?.web_name, {
    raw_live_data: liveData,
    points_calculation: liveData?.points_calculation,
    total_points: totalPoints,
    minutes: liveData?.minutes,
    inPlay,
    isCaptain,
    isViceCaptain,
    fixture_id
  });

  const getPointsBreakdown = () => {
    if (!liveData?.points_calculation) return null;
    
    const calc = liveData.points_calculation;
    return {
      minutes: calc.minutes_points || 0,
      goals: calc.goals_scored_points || 0,
      assists: calc.assist_points || 0,
      cleanSheets: calc.clean_sheet_points || 0,
      goalsConceded: calc.goals_conceded_points || 0,
      ownGoals: calc.own_goal_points || 0,
      penaltiesSaved: calc.penalty_save_points || 0,
      penaltiesMissed: calc.penalty_miss_points || 0,
      yellowCards: calc.card_points || 0,
      redCards: 0,
      saves: calc.saves_points || 0,
      bonus: calc.bonus_points || 0,
      total: calc.final_total_points || 0
    };
  };

  if (!player) {
    return (
      <div className="w-full max-w-[120px] h-[100px] bg-secondary/95 rounded-lg flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-foreground/50" />
      </div>
    );
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div 
          className={cn(
            "relative w-full max-w-[120px]",
            "p-4 rounded-lg transition-all duration-200",
            "bg-secondary/95 backdrop-blur-sm border border-accent/20",
            "hover:bg-accent/10 hover:scale-105 cursor-pointer",
            "shadow-lg hover:shadow-xl",
            "animate-fade-in",
            inPlay && "ring-2 ring-[#3DFF9A]"
          )}
          role="button"
          tabIndex={0}
          aria-label={`${player?.web_name} - ${totalPoints} points`}
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
          
          <div className="text-xl font-bold text-[#3DFF9A] text-center">
            {totalPoints}
          </div>

          <PlayerStatus 
            player={player} 
            liveData={liveData}
            fixture_id={fixture_id}
          />
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-[200px] bg-secondary/95 backdrop-blur-sm border-accent/20 animate-fade-in"
        side="right"
      >
        {liveData?.points_calculation ? (
          <PointsBreakdown 
            pointsData={getPointsBreakdown()}
            isCaptain={isCaptain}
            isViceCaptain={isViceCaptain}
          />
        ) : (
          <div className="text-sm text-foreground/70 text-center py-2">
            No points data available
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}