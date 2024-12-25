import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, List, Loader2, Trophy, Users, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PitchView } from '@/components/gameweek/PitchView';
import { ListView } from '@/components/gameweek/ListView';
import { calculateTotalPoints, calculateBenchPoints } from '@/components/gameweek/utils/points-calculator';

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
      // For now, we'll fetch the first team we find for this gameweek
      const { data, error } = await supabase
        .from('team_selections')
        .select('*')
        .eq('event', currentGameweek.id)
        .limit(1)
        .single();
      
      if (error) throw error;
      
      // Transform the data to match our TeamSelection interface
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
      <div className="container mx-auto p-4 space-y-6 animate-fade-in">
        {/* Header Section */}
        <div className="relative py-8 text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#3DFF9A] to-[#50E3C2]">
            Gameweek {currentGameweek?.id} Live
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Track your team's performance in real-time with detailed statistics and live updates
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card p-6">
            <div className="flex items-center space-x-4">
              <Trophy className="h-8 w-8 text-[#3DFF9A]" />
              <div>
                <p className="text-sm text-gray-400">Total Points</p>
                <p className="text-2xl font-bold">{totalPoints}</p>
              </div>
            </div>
          </Card>
          <Card className="glass-card p-6">
            <div className="flex items-center space-x-4">
              <Users className="h-8 w-8 text-[#3DFF9A]" />
              <div>
                <p className="text-sm text-gray-400">Players Playing</p>
                <p className="text-2xl font-bold">{playersPlaying}/11</p>
              </div>
            </div>
          </Card>
          <Card className="glass-card p-6">
            <div className="flex items-center space-x-4">
              <TrendingUp className="h-8 w-8 text-[#3DFF9A]" />
              <div>
                <p className="text-sm text-gray-400">Average Score</p>
                <p className="text-2xl font-bold">38</p>
              </div>
            </div>
          </Card>
          <Card className="glass-card p-6">
            <div className="flex items-center space-x-4">
              <Clock className="h-8 w-8 text-[#3DFF9A]" />
              <div>
                <p className="text-sm text-gray-400">Next Deadline</p>
                <p className="text-2xl font-bold">2d 4h</p>
              </div>
            </div>
          </Card>
        </div>

        {/* View Toggle */}
        <div className="flex justify-end space-x-2 mb-4">
          <button
            onClick={() => setViewMode('pitch')}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === 'pitch' ? "bg-[#3DFF9A]/20 text-[#3DFF9A]" : "text-gray-400 hover:bg-[#3DFF9A]/10"
            )}
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === 'list' ? "bg-[#3DFF9A]/20 text-[#3DFF9A]" : "text-gray-400 hover:bg-[#3DFF9A]/10"
            )}
          >
            <List className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pitch/List Section - Takes 2 columns on desktop */}
          <div className="lg:col-span-2">
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

          {/* Stats Section - Takes 1 column on desktop */}
          <div className="space-y-4">
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Live Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Points</span>
                  <span className="font-medium">{totalPoints}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Bench Points</span>
                  <span className="font-medium">{benchPoints}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Goals</span>
                  <span className="font-medium">
                    {liveData?.reduce((sum, p) => sum + (p.goals_scored || 0), 0) || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Assists</span>
                  <span className="font-medium">
                    {liveData?.reduce((sum, p) => sum + (p.assists || 0), 0) || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Bonus Points</span>
                  <span className="font-medium">
                    {liveData?.reduce((sum, p) => sum + (p.bonus || 0), 0) || 0}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
