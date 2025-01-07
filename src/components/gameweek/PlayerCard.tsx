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
import { calculatePlayerPoints } from '@/utils/points-calculator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlayerPerformanceData } from '@/components/gameweek-live/types';

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
  
  // Fetch fixture performances for bonus point calculation
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

      return data as unknown as PlayerPerformanceData[];
    }
  });

  // Calculate points using our centralized calculator
  const pointsBreakdown = React.useMemo(() => {
    if (!liveData) return null;

    const performance = {
      ...liveData,
      player: {
        id: player.id,
        web_name: player.web_name,
        element_type: player.element_type,
        team: player.team
      },
      fixture_id: fixture_id
    } as unknown as PlayerPerformanceData;

    return calculatePlayerPoints(
      performance,
      isCaptain,
      isViceCaptain,
      fixturePerformances
    );
  }, [liveData, player, isCaptain, isViceCaptain, fixturePerformances, fixture_id]);

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
          aria-label={`${player?.web_name} - ${pointsBreakdown?.total || 0} points`}
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
            {pointsBreakdown?.total || 0}
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
          pointsData={pointsBreakdown}
          isCaptain={isCaptain}
          isViceCaptain={isViceCaptain}
        />
      </HoverCardContent>
    </HoverCard>
  );
}