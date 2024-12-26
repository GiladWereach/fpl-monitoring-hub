import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GameweekHeader } from '@/components/gameweek/GameweekHeader';
import { ViewToggle } from '@/components/gameweek/ViewToggle';
import { LivePerformance } from '@/components/gameweek/LivePerformance';
import { PitchView } from '@/components/gameweek/PitchView';
import { ListView } from '@/components/gameweek/ListView';
import { BenchPlayers } from '@/components/gameweek/BenchPlayers';
import { calculateTotalPoints, calculateBenchPoints } from '@/components/gameweek/utils/points-calculator';
import { TeamSelection, Player } from '@/components/gameweek/types';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function Gameweek() {
  const [viewMode, setViewMode] = useState<'pitch' | 'list'>('pitch');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get team ID from localStorage
  const teamId = localStorage.getItem('lastTeamId');

  // Redirect if no team ID
  useEffect(() => {
    if (!teamId) {
      toast({
        title: "No team selected",
        description: "Please enter your team ID first",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [teamId, navigate, toast]);

  const { data: currentGameweek, isLoading: gameweekLoading } = useQuery({
    queryKey: ['current-gameweek'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_current', true)
        .single();
      
      if (error) throw error;
      console.log('Current gameweek:', data);
      return data;
    }
  });

  const { data: teamSelection, isLoading: teamLoading } = useQuery({
    queryKey: ['team-selection', currentGameweek?.id, teamId],
    enabled: !!currentGameweek?.id && !!teamId,
    queryFn: async () => {
      console.log('Fetching team selection for team:', teamId, 'gameweek:', currentGameweek.id);
      const { data, error } = await supabase
        .from('team_selections')
        .select('*')
        .eq('event', currentGameweek.id)
        .eq('fpl_team_id', teamId)
        .single();
      
      if (error) throw error;
      console.log('Team selection:', data);
      return data as TeamSelection;
    }
  });

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['players', teamSelection?.picks],
    enabled: !!teamSelection,
    queryFn: async () => {
      const playerIds = teamSelection.picks.map(pick => pick.element);
      console.log('Fetching players:', playerIds);
      const { data, error } = await supabase
        .from('players')
        .select('id, web_name, team, element_type')
        .in('id', playerIds);
      
      if (error) throw error;
      console.log('Players data:', data);
      return data as Player[];
    }
  });

  const { data: liveData, isLoading: liveDataLoading } = useQuery({
    queryKey: ['live-performance', currentGameweek?.id, teamSelection?.picks],
    enabled: !!currentGameweek?.id && !!teamSelection?.picks,
    queryFn: async () => {
      const playerIds = teamSelection.picks.map(p => p.element);
      console.log('Fetching live data for players:', playerIds);
      const { data, error } = await supabase
        .from('gameweek_live_performance')
        .select('*')
        .eq('event_id', currentGameweek.id)
        .in('player_id', playerIds);
      
      if (error) throw error;
      console.log('Live performance data:', data);
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

  if (!teamSelection) {
    return (
      <div className="flex h-[50vh] items-center justify-center flex-col gap-4">
        <p className="text-lg">No team data found for gameweek {currentGameweek?.id}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-[#3DFF9A] text-black rounded-lg hover:bg-[#3DFF9A]/90"
        >
          Go back home
        </button>
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
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>

          <div className="space-y-4">
            <LivePerformance 
              totalPoints={totalPoints}
              benchPoints={benchPoints}
              liveData={liveData}
            />
            <BenchPlayers 
              benchPlayers={[12, 13, 14, 15]}
              getPlayerData={getPlayerData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}