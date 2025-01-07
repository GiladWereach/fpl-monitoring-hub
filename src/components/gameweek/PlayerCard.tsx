import React, { useMemo } from 'react';
import { cn } from "@/lib/utils";
import { Copyright, Loader2 } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { PlayerStatus } from './PlayerStatus';
import { PointsBreakdown } from './components/PointsBreakdown';
import { calculatePlayerPoints } from '@/utils/points-calculator';
import { PlayerPerformanceData } from '@/components/gameweek-live/types';
import { useToast } from '@/hooks/use-toast';

interface PlayerCardProps {
  player: any;
  isCaptain: boolean;
  isViceCaptain: boolean;
  liveData?: PlayerPerformanceData;
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
  const { toast } = useToast();

  console.log('PlayerCard render for:', player?.web_name, {
    raw_live_data: liveData,
    points_calculation: liveData?.points_calculation,
    total_points: liveData?.total_points,
    minutes: liveData?.minutes,
    isCaptain,
    isViceCaptain,
    fixture_id
  });

  const totalPoints = useMemo(() => {
    console.log(`Starting points calculation for ${player?.web_name}:`, {
      has_live_data: !!liveData,
      points_calculation: liveData?.points_calculation,
      points_calculation_exists: liveData?.points_calculation !== null,
      final_total_points: liveData?.points_calculation?.final_total_points,
      total_points: liveData?.total_points
    });
    
    if (!liveData) {
      console.log(`No live data for ${player?.web_name}, returning 0`);
      return 0;
    }

    // Check if points_calculation exists and is not null
    if (liveData.points_calculation !== null && liveData.points_calculation !== undefined) {
      // Then check if final_total_points exists and is not undefined
      if (typeof liveData.points_calculation.final_total_points === 'number') {
        const basePoints = liveData.points_calculation.final_total_points;
        const finalPoints = isCaptain ? basePoints * 2 : basePoints;
        console.log(`Using points calculation for ${player?.web_name}:`, {
          basePoints,
          isCaptain,
          finalPoints,
          calculation: 'from points_calculation'
        });
        return finalPoints;
      }
    }
    
    // Fallback to total_points only if points_calculation is null or undefined
    const basePoints = liveData.total_points || 0;
    const finalPoints = isCaptain ? basePoints * 2 : basePoints;
    console.log(`Using total_points fallback for ${player?.web_name}:`, {
      basePoints,
      isCaptain,
      finalPoints,
      calculation: 'from total_points fallback'
    });
    
    return finalPoints;
  }, [liveData, isCaptain, player?.web_name]);

  const getPointsBreakdown = () => {
    console.log(`Getting points breakdown for ${player?.web_name}:`, {
      has_points_calculation: !!liveData?.points_calculation,
      points_calculation_exists: liveData?.points_calculation !== null,
      points_calculation: liveData?.points_calculation
    });
    
    if (!liveData?.points_calculation) return null;
    
    const calc = liveData.points_calculation;
    const breakdown = {
      minutes: calc.minutes_points,
      goals: calc.goals_scored_points,
      assists: calc.assist_points,
      cleanSheets: calc.clean_sheet_points,
      goalsConceded: calc.goals_conceded_points,
      ownGoals: calc.own_goal_points,
      penaltiesSaved: calc.penalty_save_points,
      penaltiesMissed: calc.penalty_miss_points,
      yellowCards: 0,
      redCards: 0,
      saves: calc.saves_points,
      bonus: calc.bonus_points,
      total: calc.final_total_points
    };

    console.log(`Points breakdown for ${player?.web_name}:`, breakdown);
    return breakdown;
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
            "animate-fade-in"
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