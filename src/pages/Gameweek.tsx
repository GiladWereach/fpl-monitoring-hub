import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GameweekHeader } from '@/components/gameweek/GameweekHeader';
import { ViewToggle } from '@/components/gameweek/ViewToggle';
import { LivePerformance } from '@/components/gameweek/LivePerformance';
import { PitchView } from '@/components/gameweek/PitchView';
import { ListView } from '@/components/gameweek/ListView';
import { calculateTotalPoints, calculateBenchPoints } from '@/components/gameweek/utils/points-calculator';
import { TeamSelection, Player } from '@/components/gameweek/types';
import { Loader2 } from 'lucide-react';

export default function Gameweek() {
  const [viewMode, setViewMode] = useState<'pitch' | 'list'>('pitch');

  const { data: currentGameweek, isLoading: gameweekLoading } = useQuery({
    queryKey: ['current-gameweek'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_current', true)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: teamSelection, isLoading: teamLoading } = useQuery({
    queryKey: ['team-selection', currentGameweek?.id],
    enabled: !!currentGameweek?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_selections')
        .select('*')
        .eq('event', currentGameweek.id)
        .limit(1)
        .single();
      
      if (error) throw error;
      
      const picks = (data.picks as any[]).map(pick => ({
        element: pick.element,
        position: pick.position,
        multiplier: pick.multiplier,
        is_captain: pick.is_captain || false,
        is_vice_captain: pick.is_vice_captain || false
      }));

      return {
        ...data,
        picks
      } as TeamSelection;
    }
  });

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    enabled: !!teamSelection,
    queryFn: async () => {
      const playerIds = teamSelection.picks.map(pick => pick.element);
      const { data, error } = await supabase
        .from('players')
        .select('id, web_name, team, element_type')
        .in('id', playerIds);
      
      if (error) throw error;
      return data as Player[];
    }
  });

  const { data: liveData, isLoading: liveDataLoading } = useQuery({
    queryKey: ['live-performance', currentGameweek?.id],
    enabled: !!currentGameweek?.id && !!teamSelection?.picks,
    queryFn: async () => {
      const playerIds = teamSelection.picks.map(p => p.element);
      const { data, error } = await supabase
        .from('gameweek_live_performance')
        .select('*')
        .eq('event_id', currentGameweek.id)
        .in('player_id', playerIds);
      
      if (error) throw error;
      return data;
    }
  });

  const isLoading = gameweekLoading || teamLoading || playersLoading || liveDataLoading;

  const getPlayerData = (pick: any) => {
    if (!teamSelection || !players) return null;
    const player = players.find(p => p.id === pick.element);
    const playerLiveData = liveData?.find(d => d.player_id === pick.element);
    const points = playerLiveData?.total_points || 0;
    
    return {
      ...player,
      points: pick.is_captain ? points * 2 : points,
      liveData: playerLiveData
    };
  };

  const totalPoints = calculateTotalPoints(teamSelection?.picks || [], getPlayerData);
  const benchPoints = calculateBenchPoints(teamSelection?.picks || [], getPlayerData);
  
  // Calculate players playing (only from starting 11)
  const playersPlaying = teamSelection?.picks
    .filter((pick: any) => pick.position <= 11)
    .filter((pick: any) => {
      const playerData = getPlayerData(pick);
      return playerData?.liveData?.minutes > 0;
    }).length || 0;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#3DFF9A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-white">
      <div className="container mx-auto p-4 space-y-4 animate-fade-in">
        <GameweekHeader 
          currentGameweek={currentGameweek}
          totalPoints={totalPoints}
          playersPlaying={playersPlaying}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 relative">
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
            {viewMode === 'pitch' ? (
              <PitchView 
                teamSelection={teamSelection}
                players={players}
                liveData={liveData}
              />
            ) : (
              <ListView
                teamSelection={teamSelection}
                players={players}
                liveData={liveData}
              />
            )}
          </div>

          <div className="space-y-4">
            <LivePerformance 
              totalPoints={totalPoints}
              benchPoints={benchPoints}
              liveData={liveData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
