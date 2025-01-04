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

  // Get current gameweek
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
      
      console.log('Current gameweek:', data);
      return data;
    }
  });

  // Get team data using our hook
  const { teamData, teamLoading, existingTeam } = useTeamData(teamId);

  // Query for players data
  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['players', teamData?.data?.picks],
    enabled: !!teamData?.data?.picks,
    queryFn: async () => {
      const playerIds = teamData.data.picks.map(pick => pick.element);
      console.log('Fetching players:', playerIds);
      const { data, error } = await supabase
        .from('players')
        .select('id, web_name, team, element_type')
        .in('id', playerIds);
      
      if (error) throw error;
      console.log('Players data:', data);
      return data;
    }
  });

  // Query for points calculation data including bonus points
  const { data: liveData, isLoading: liveDataLoading } = useQuery({
    queryKey: ['points-calculation', currentGameweek?.id, teamData?.data?.picks],
    enabled: !!currentGameweek?.id && !!teamData?.data?.picks,
    queryFn: async () => {
      const playerIds = teamData.data.picks.map(p => p.element);
      console.log('Fetching points calculation data for players:', playerIds);
      const { data, error } = await supabase
        .from('player_points_calculation')
        .select(`
          player_id,
          minutes_points,
          goals_scored_points,
          assist_points,
          clean_sheet_points,
          bonus_points,
          final_total_points
        `)
        .eq('event_id', currentGameweek.id)
        .in('player_id', playerIds);
      
      if (error) throw error;
      
      // Map the data to match the expected format
      const mappedData = data.map(d => ({
        player_id: d.player_id,
        minutes: d.minutes_points > 0 ? 60 : 0,
        total_points: d.final_total_points || 0,
        goals_scored: d.goals_scored_points > 0 ? 1 : 0,
        assists: d.assist_points > 0 ? 1 : 0,
        clean_sheets: d.clean_sheet_points > 0 ? 1 : 0,
        bonus: d.bonus_points || 0,
        // Add individual point contributions for the card
        points_breakdown: {
          minutes: d.minutes_points || 0,
          goals: d.goals_scored_points || 0,
          assists: d.assist_points || 0,
          clean_sheets: d.clean_sheet_points || 0,
          bonus: d.bonus_points || 0
        }
      }));
      
      console.log('Points calculation data:', mappedData);
      return mappedData;
    }
  });

  const isLoading = gameweekLoading || teamLoading || playersLoading || liveDataLoading;

  if (!teamId) {
    return null; // useEffect will handle the redirect
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-white">
      <div className="container mx-auto p-4 space-y-4 animate-fade-in">
        <GameweekHeader 
          currentGameweek={currentGameweek}
          totalPoints={teamData?.data?.stats?.points || 0}
          playersPlaying={teamData?.data?.picks?.filter(p => 
            liveData?.find(d => d.player_id === p.element)?.minutes > 0
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
    </div>
  );
}