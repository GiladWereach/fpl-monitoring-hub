import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Activity, Signal } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import PlayerPerformance from '@/components/gameweek-live/PlayerPerformance';
import BonusPointsTracker from '@/components/gameweek-live/BonusPointsTracker';
import MatchCards from '@/components/gameweek-live/MatchCards';
import { LiveStatus } from '@/components/dashboard/LiveStatus';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { GameweekTransition } from '@/components/gameweek-live/GameweekTransition';
import { DeadlineTimer } from '@/components/gameweek-live/DeadlineTimer';

export default function GameWeekLive() {
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

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

  const { data: activeMatches } = useQuery({
    queryKey: ['active-matches', currentGameweek?.id],
    enabled: !!currentGameweek?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fixtures')
        .select('*')
        .eq('event', currentGameweek.id)
        .eq('started', true)
        .is('finished_provisional', false);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000
  });

  if (gameweekLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">
            Gameweek {currentGameweek?.id} Live
          </h1>
          <LiveStatus />
        </div>
        <Alert variant="default" className="w-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Data updates automatically every minute
          </AlertDescription>
        </Alert>
      </div>

      {/* Add DeadlineTimer component */}
      <DeadlineTimer />

      {/* Show transition status if in progress */}
      <GameweekTransition />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatusCard
          title="Active Matches"
          value={activeMatches?.length || 0}
          status={activeMatches?.length ? 'success' : 'info'}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatusCard
          title="Live Updates"
          value="Active"
          status="success"
          icon={<Signal className="h-4 w-4" />}
          indicator={<LiveStatus showLabel={false} />}
        />
        <StatusCard
          title="Last Calculation"
          value="2 mins ago"
          status="info"
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      <Tabs defaultValue="matches" className="w-full">
        <TabsList>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="performance">Player Performance</TabsTrigger>
          <TabsTrigger value="bonus">Bonus Points</TabsTrigger>
        </TabsList>

        <TabsContent value="matches">
          <Card className="p-4">
            <MatchCards 
              gameweek={currentGameweek?.id} 
              onMatchSelect={setSelectedMatchId}
              selectedMatchId={selectedMatchId}
            />
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card className="p-4">
            <PlayerPerformance 
              gameweek={currentGameweek?.id} 
              matchId={selectedMatchId}
            />
          </Card>
        </TabsContent>

        <TabsContent value="bonus">
          <Card className="p-4">
            <BonusPointsTracker 
              gameweek={currentGameweek?.id}
              matchId={selectedMatchId}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
