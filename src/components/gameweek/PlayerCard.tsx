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
}

export function PlayerCard({ player, isCaptain, isViceCaptain, liveData }: PlayerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Query points calculation data
  const { data: pointsCalculation } = useQuery({
    queryKey: ['points-calculation', player?.id, liveData?.fixture_id],
    enabled: !!player?.id && !!liveData?.fixture_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_points_calculation')
        .select('*')
        .eq('player_id', player.id)
        .eq('fixture_id', liveData.fixture_id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Calculate total points from raw_total_points and bonus
  const calculateTotalPoints = () => {
    // Get raw points from calculation if available
    const rawPoints = pointsCalculation?.raw_total_points || 0;
    
    // Add bonus points if available
    const bonusPoints = liveData?.bonus || 0;
    const totalPoints = rawPoints + bonusPoints;
    
    // Apply captain multiplier if applicable
    const finalPoints = isCaptain ? totalPoints * 2 : totalPoints;

    console.log('Points calculation for', player?.web_name, {
      raw_points: rawPoints,
      bonus_points: bonusPoints,
      total_points: totalPoints,
      final_points: finalPoints,
      is_captain: isCaptain
    });

    return finalPoints;
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
    points_calculation: pointsCalculation,
    live_data: liveData ? {
      minutes: liveData.minutes,
      total_points: points,
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