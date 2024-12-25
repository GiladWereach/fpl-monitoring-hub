import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, List, Loader2, Trophy, Users, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamSelection {
  picks: {
    element: number;
    position: number;
    multiplier: number;
    is_captain: boolean;
    is_vice_captain: boolean;
  }[];
  formation: string;
}

interface Player {
  id: number;
  web_name: string;
  team: number;
  element_type: number;
}

export default function Gameweek() {
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
      return data as TeamSelection;
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

  const isLoading = gameweekLoading || teamLoading || playersLoading;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#3DFF9A]" />
      </div>
    );
  }

  const getPlayerByPosition = (position: number) => {
    if (!teamSelection || !players) return null;
    const pick = teamSelection.picks.find(p => p.position === position);
    if (!pick) return null;
    return {
      ...players.find(p => p.id === pick.element),
      isCaptain: pick.is_captain,
      isViceCaptain: pick.is_vice_captain,
      multiplier: pick.multiplier
    };
  };

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
                <p className="text-2xl font-bold">42</p>
              </div>
            </div>
          </Card>
          <Card className="glass-card p-6">
            <div className="flex items-center space-x-4">
              <Users className="h-8 w-8 text-[#3DFF9A]" />
              <div>
                <p className="text-sm text-gray-400">Players Playing</p>
                <p className="text-2xl font-bold">7/11</p>
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pitch Section - Takes 2 columns on desktop */}
          <div className="lg:col-span-2">
            <Card className="glass-card p-6">
              <div className="relative aspect-[16/9] w-full">
                {/* Pitch Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#3DFF9A]/5 to-transparent rounded-lg border border-[#3DFF9A]/10">
                  {/* Field Lines */}
                  <div className="absolute inset-0 flex flex-col">
                    <div className="h-1/3 border-b border-[#3DFF9A]/20" />
                    <div className="h-1/3 border-b border-[#3DFF9A]/20" />
                  </div>
                  {/* Center Circle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-[#3DFF9A]/20 rounded-full" />
                </div>
                
                {/* Player Positions */}
                <div className="absolute inset-0 grid grid-rows-4 gap-4 p-8">
                  {/* Forwards Row */}
                  <div className="flex justify-around items-center">
                    {[9, 10, 11].map(position => {
                      const player = getPlayerByPosition(position);
                      if (!player) return null;
                      return (
                        <div key={position} className="text-center">
                          <div className="bg-[#3DFF9A]/10 px-4 py-2 rounded-full border border-[#3DFF9A]/20">
                            <p className="text-sm font-medium">{player.web_name}</p>
                            {player.isCaptain && <span className="text-xs text-[#3DFF9A]">(C)</span>}
                            {player.isViceCaptain && <span className="text-xs text-[#3DFF9A]">(V)</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Midfielders Row */}
                  <div className="flex justify-around items-center">
                    {[6, 7, 8].map(position => {
                      const player = getPlayerByPosition(position);
                      if (!player) return null;
                      return (
                        <div key={position} className="text-center">
                          <div className="bg-[#3DFF9A]/10 px-4 py-2 rounded-full border border-[#3DFF9A]/20">
                            <p className="text-sm font-medium">{player.web_name}</p>
                            {player.isCaptain && <span className="text-xs text-[#3DFF9A]">(C)</span>}
                            {player.isViceCaptain && <span className="text-xs text-[#3DFF9A]">(V)</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Defenders Row */}
                  <div className="flex justify-around items-center">
                    {[2, 3, 4, 5].map(position => {
                      const player = getPlayerByPosition(position);
                      if (!player) return null;
                      return (
                        <div key={position} className="text-center">
                          <div className="bg-[#3DFF9A]/10 px-4 py-2 rounded-full border border-[#3DFF9A]/20">
                            <p className="text-sm font-medium">{player.web_name}</p>
                            {player.isCaptain && <span className="text-xs text-[#3DFF9A]">(C)</span>}
                            {player.isViceCaptain && <span className="text-xs text-[#3DFF9A]">(V)</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Goalkeeper Row */}
                  <div className="flex justify-center items-center">
                    {[1].map(position => {
                      const player = getPlayerByPosition(position);
                      if (!player) return null;
                      return (
                        <div key={position} className="text-center">
                          <div className="bg-[#3DFF9A]/10 px-4 py-2 rounded-full border border-[#3DFF9A]/20">
                            <p className="text-sm font-medium">{player.web_name}</p>
                            {player.isCaptain && <span className="text-xs text-[#3DFF9A]">(C)</span>}
                            {player.isViceCaptain && <span className="text-xs text-[#3DFF9A]">(V)</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Stats Section - Takes 1 column on desktop */}
          <div className="space-y-4">
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Live Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Points</span>
                  <span className="font-medium">42</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Rank Change</span>
                  <span className="text-[#3DFF9A]">↑ 12,345</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Team Value</span>
                  <span className="font-medium">£102.5m</span>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
              <div className="space-y-4">
                {/* We'll implement this with real data later */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Player 1</span>
                  <span className="font-medium">15 pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Player 2</span>
                  <span className="font-medium">12 pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Player 3</span>
                  <span className="font-medium">8 pts</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
