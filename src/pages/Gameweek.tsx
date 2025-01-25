import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GameweekHeader } from '@/components/gameweek/GameweekHeader';
import { TeamView } from '@/components/gameweek/TeamView';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useTeamData } from '@/hooks/useTeamData';

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
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('No current gameweek found');
      
      console.log('Current gameweek data:', data);
      return data;
    }
  });

  // Get team data using our hook
  const { teamData, teamLoading, existingTeam } = useTeamData(teamId);

  // Query for players data - Now including chance_of_playing_this_round and status
  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['players', teamData?.data?.picks],
    enabled: !!teamData?.data?.picks,
    queryFn: async () => {
      const playerIds = teamData.data.picks.map(pick => pick.element);
      console.log('Fetching players:', playerIds);
      const { data, error } = await supabase
        .from('players')
        .select(`
          id, 
          web_name, 
          team, 
          element_type,
          chance_of_playing_this_round,
          status
        `)
        .in('id', playerIds);
      
      if (error) throw error;
      
      console.log('Players data fetched:', data);
      return data;
    }
  });

  const { data: liveData, isLoading: liveDataLoading } = useQuery({
    queryKey: ['points-calculation', currentGameweek?.id, teamData?.data?.picks],
    enabled: !!currentGameweek?.id && !!teamData?.data?.picks,
    queryFn: async () => {
      const playerIds = teamData.data.picks.map(p => p.element);
      console.log('Fetching points calculation data for players:', playerIds);
      
      // First get the live performance data
      const { data: livePerformance, error: liveError } = await supabase
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
        .eq('event_id', currentGameweek.id)
        .in('player_id', playerIds);

      if (liveError) throw liveError;
      console.log('Live performance data:', livePerformance);

      // Then get the points calculation data
      const { data: pointsCalc, error: pointsError } = await supabase
        .from('player_points_calculation')
        .select('*')
        .eq('event_id', currentGameweek.id)
        .in('player_id', playerIds);

      if (pointsError) throw pointsError;
      console.log('Points calculation data:', pointsCalc);
      
      // Combine the data
      const combinedData = livePerformance?.map(perf => {
        const points = pointsCalc?.find(p => 
          p.player_id === perf.player_id && 
          p.event_id === currentGameweek.id &&
          p.fixture_id === perf.fixture_id
        );

        console.log(`Combined data for player ${perf.player_id}:`, {
          performance: perf,
          pointsCalculation: points,
          totalPoints: points?.final_total_points || 0
        });

        return {
          ...perf,
          points_calculation: points ? {
            minutes_points: points.minutes_points || 0,
            goals_scored_points: points.goals_scored_points || 0,
            assist_points: points.assist_points || 0,
            clean_sheet_points: points.clean_sheet_points || 0,
            goals_conceded_points: points.goals_conceded_points || 0,
            own_goal_points: points.own_goal_points || 0,
            penalty_save_points: points.penalty_save_points || 0,
            penalty_miss_points: points.penalty_miss_points || 0,
            saves_points: points.saves_points || 0,
            bonus_points: points.bonus_points || 0,
            final_total_points: points.final_total_points || 0
          } : null
        };
      });

      return combinedData || [];
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const isLoading = gameweekLoading || teamLoading || playersLoading || liveDataLoading;

  console.log('Gameweek page render:', {
    teamId,
    hasTeamData: !!teamData?.data,
    hasPlayers: !!players?.length,
    hasLiveData: !!liveData?.length,
    teamData: teamData?.data,
    liveDataSample: liveData?.[0],
    isLoading
  });

  if (!teamId) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <GameweekHeader 
        currentGameweek={currentGameweek}
        totalPoints={teamData?.data?.stats?.points || 0}
        playersPlaying={teamData?.data?.picks?.filter(p => 
          liveData?.find(d => d.player?.id === p.element)?.minutes > 0
        )?.length || 0}
      />

      <TeamView 
        teamData={teamData}
        teamLoading={isLoading}
        viewMode={viewMode}
        setViewMode={setViewMode}
        players={players}
        liveData={liveData}
      />
    </div>
  );
}