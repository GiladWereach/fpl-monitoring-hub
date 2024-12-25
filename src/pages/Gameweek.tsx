import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, List, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  if (gameweekLoading) {
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

        {/* Main Content */}
        <Tabs defaultValue="pitch" className="w-full">
          <TabsList className="w-full max-w-md mx-auto bg-[#1A1F2C]/50 border border-[#3DFF9A]/10">
            <TabsTrigger 
              value="pitch" 
              className="flex-1 data-[state=active]:bg-[#3DFF9A]/10 data-[state=active]:text-[#3DFF9A]"
            >
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Pitch View
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="list"
              className="flex-1 data-[state=active]:bg-[#3DFF9A]/10 data-[state=active]:text-[#3DFF9A]"
            >
              <div className="flex items-center gap-2">
                <List className="h-4 w-4" />
                List View
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pitch">
            <Card className="bg-[#1A1F2C]/50 border border-[#3DFF9A]/10 backdrop-blur-sm p-6">
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
                
                {/* Placeholder for player positions */}
                <div className="absolute inset-0 grid grid-rows-4 gap-4 p-8">
                  <div className="text-center text-[#3DFF9A]/60">
                    Players will be positioned here
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="list">
            <Card className="bg-[#1A1F2C]/50 border border-[#3DFF9A]/10 backdrop-blur-sm p-6">
              <div className="space-y-4">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Average Points', value: '42' },
                    { label: 'Highest Score', value: '89' },
                    { label: 'Players Playing', value: '7/11' },
                  ].map((stat, index) => (
                    <div 
                      key={index}
                      className="bg-[#1A1F2C]/30 p-4 rounded-lg border border-[#3DFF9A]/10"
                    >
                      <div className="text-sm text-gray-400">{stat.label}</div>
                      <div className="text-2xl font-bold text-[#3DFF9A]">{stat.value}</div>
                    </div>
                  ))}
                </div>
                
                {/* Player List Placeholder */}
                <div className="mt-6 space-y-2">
                  <div className="text-center text-gray-400">
                    Detailed player statistics will appear here
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}