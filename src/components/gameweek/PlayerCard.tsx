import React from 'react';
import { cn } from "@/lib/utils";
import { Copyright } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { PlayerStatus } from './PlayerStatus';
import { PointsBreakdown } from './components/PointsBreakdown';
import { calculatePlayerPoints } from '@/utils/points-calculator';
import { PlayerPerformanceData } from '@/components/gameweek-live/types';

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
  console.log('PlayerCard render:', {
    player: player?.web_name,
    liveData,
    isCaptain,
    isViceCaptain,
    fixture_id,
    eventId
  });

  // Calculate points using the points calculation from live data
  const totalPoints = React.useMemo(() => {
    if (!liveData) return 0;
    
    const basePoints = liveData.points_calculation?.final_total_points || 0;
    return isCaptain ? basePoints * 2 : basePoints;
  }, [liveData, isCaptain]);

  const getPointsBreakdown = () => {
    if (!liveData?.points_calculation) return null;
    
    const calc = liveData.points_calculation;
    return {
      minutes: calc.minutes_points,
      goals: calc.goals_scored_points,
      assists: calc.assist_points,
      cleanSheets: calc.clean_sheet_points,
      goalsConceded: calc.goals_conceded_points,
      ownGoals: calc.own_goal_points,
      penaltiesSaved: calc.penalty_save_points,
      penaltiesMissed: calc.penalty_miss_points,
      yellowCards: 0, // These aren't in the points calculation yet
      redCards: 0, // These aren't in the points calculation yet
      saves: calc.saves_points,
      bonus: calc.bonus_points,
      total: calc.final_total_points
    };
  };

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
        {liveData?.points_calculation && (
          <PointsBreakdown 
            pointsData={getPointsBreakdown()}
            isCaptain={isCaptain}
            isViceCaptain={isViceCaptain}
          />
        )}
      </HoverCardContent>
    </HoverCard>
  );
}