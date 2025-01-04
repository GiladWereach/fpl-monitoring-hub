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
      bps: liveData.bps,
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

    let basePoints = 0;
    let bonusPoints = 0;

    if (pointsCalculation) {
      // Use points calculation data if available
      basePoints = pointsCalculation.raw_total_points || 0;
      bonusPoints = pointsCalculation.bonus_points || 0;
      
      console.log(`${player?.web_name} - Points from calculation:`, {
        basePoints,
        bonusPoints,
        total: basePoints + bonusPoints,
        breakdown: pointsCalculation
      });
    } else if (liveData) {
      // Calculate base points from breakdown
      basePoints = liveData.points_breakdown ? (
        Object.entries(liveData.points_breakdown)
          .filter(([key]) => key !== 'bonus') // Exclude bonus from base points
          .reduce((sum: number, [_, val]: [string, number]) => sum + val, 0)
      ) : 0;
      
      // Get bonus points separately
      bonusPoints = liveData.bonus || 0;
      
      console.log(`${player?.web_name} - Live points calculation:`, {
        basePoints,
        bonusPoints,
        total: basePoints + bonusPoints,
        points_breakdown: liveData.points_breakdown,
        bps: liveData.bps
      });
    }
    
    const totalPoints = basePoints + bonusPoints;
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