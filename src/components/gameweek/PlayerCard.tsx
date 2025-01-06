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
import { calculateBonusPoints } from '@/components/gameweek-live/utils/bonus-utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

  // Fetch all performances for the fixture to calculate bonus points
  const { data: fixturePerformances } = useQuery({
    queryKey: ['fixture-performances', fixture_id, eventId],
    enabled: !!fixture_id && !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gameweek_live_performance')
        .select(`
          *,
          player:players(
            id,
            web_name,
            team:teams(
              short_name
            )
          )
        `)
        .eq('event_id', eventId)
        .eq('fixture_id', fixture_id);

      if (error) {
        console.error('Error fetching fixture performances:', error);
        return [];
      }

      console.log(`Fixture ${fixture_id} performances:`, data);
      return data || [];
    }
  });

  // Calculate bonus points if we have fixture performances
  const calculatedBonus = React.useMemo(() => {
    if (!fixturePerformances?.length || !player?.id) return 0;

    const playerBPSData = fixturePerformances
      .filter(p => p.player_id === player.id)
      .map(p => ({
        player_id: p.player_id,
        bps: p.bps,
        fixture_id: p.fixture_id,
        minutes: p.minutes
      }));

    const allBPSData = fixturePerformances.map(p => ({
      player_id: p.player_id,
      bps: p.bps,
      fixture_id: p.fixture_id,
      minutes: p.minutes
    }));

    const bonus = calculateBonusPoints(playerBPSData, allBPSData);
    console.log(`Calculated bonus for ${player.web_name}:`, {
      playerBPS: playerBPSData,
      allBPS: allBPSData,
      bonus: bonus
    });
    return bonus;
  }, [fixturePerformances, player?.id]);

  // Calculate total points including bonus and captain multiplier
  const points = React.useMemo(() => {
    const basePoints = pointsData?.final_total_points || 0;
    const totalWithBonus = basePoints + calculatedBonus;
    const finalPoints = isCaptain ? totalWithBonus * 2 : totalWithBonus;

    console.log(`Points calculation for ${player?.web_name}:`, {
      base_points: basePoints,
      bonus_points: calculatedBonus,
      is_captain: isCaptain,
      final_points: finalPoints
    });

    return finalPoints;
  }, [pointsData?.final_total_points, calculatedBonus, isCaptain, player?.web_name]);

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
          bonusPoints={calculatedBonus}
        />
      </HoverCardContent>
    </HoverCard>
  );
}