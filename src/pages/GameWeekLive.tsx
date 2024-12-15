import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import PlayerPerformance from '@/components/gameweek-live/PlayerPerformance';
import BonusPointsTracker from '@/components/gameweek-live/BonusPointsTracker';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function GameWeekLive() {
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
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Gameweek {currentGameweek?.id} Live
        </h1>
        <Alert variant="default" className="w-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Data updates automatically every minute
          </AlertDescription>
        </Alert>
      </div>

      <Tabs defaultValue="matches" className="w-full">
        <TabsList>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="performance">Player Performance</TabsTrigger>
          <TabsTrigger value="bonus">Bonus Points</TabsTrigger>
        </TabsList>

        <TabsContent value="matches">
          <Card className="p-4">
            <h2>Match Updates</h2>
            {/* Match cards component will be implemented here */}
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card className="p-4">
            <PlayerPerformance gameweek={currentGameweek?.id} />
          </Card>
        </TabsContent>

        <TabsContent value="bonus">
          <Card className="p-4">
            <BonusPointsTracker gameweek={currentGameweek?.id} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}