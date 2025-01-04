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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
    live_data: liveData ? {
      minutes: liveData.minutes,
      points: liveData.total_points,
      bonus: liveData.bonus,
      fixture_id: liveData.fixture_id,
      points_breakdown: liveData.points_breakdown
    } : 'No live data',
    passed_fixture_id: fixture_id
  });

  // Query points calculation data
  const { data: pointsCalculation } = useQuery({
    queryKey: ['points-calculation', player?.id, fixture_id],
    enabled: !!player?.id && !!fixture_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_points_calculation')
        .select('*')
        .eq('player_id', player.id)
        .eq('fixture_id', fixture_id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching points calculation:', error);
        return null;
      }
      
      console.log('Points calculation data for', player?.web_name, data);
      return data;
    }
  });

  // Calculate total points including bonus
  const calculateTotalPoints = () => {
    if (!liveData && !pointsCalculation) return 0;

    let totalPoints = 0;

    if (pointsCalculation) {
      // Use points calculation data if available
      totalPoints = pointsCalculation.final_total_points;
      console.log(`${player?.web_name} - Points from calculation:`, {
        total: totalPoints,
        breakdown: pointsCalculation
      });
    } else if (liveData) {
      // Use points from live data
      const basePoints = liveData.points_breakdown ? (
        Object.values(liveData.points_breakdown).reduce((sum: number, val: number) => sum + val, 0)
      ) : 0;
      
      const bonusPoints = liveData.bonus || 0;
      totalPoints = basePoints + bonusPoints;
      
      console.log(`${player?.web_name} - Points calculation:`, {
        basePoints,
        bonusPoints,
        totalPoints,
        isCaptain,
        points_breakdown: liveData.points_breakdown
      });
    }
    
    return isCaptain ? totalPoints * 2 : totalPoints;
  };

  const points = calculateTotalPoints();

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
          pointsCalculation={pointsCalculation}
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