import { LiveStatus } from "./LiveStatus";
import { CalculationsManager } from "./CalculationsManager";
import { RecentActivity } from "./RecentActivity";
import { PointsCalculationFormula } from "./PointsCalculationFormula";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusCard } from "./StatusCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Database, Server } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "@/hooks/use-toast";

export function CalculationControlCenter() {
  const { data: currentEvent } = useQuery({
    queryKey: ['current-event'],
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
    queryKey: ['active-matches', currentEvent?.id],
    enabled: !!currentEvent?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fixtures')
        .select('*')
        .eq('event', currentEvent.id)
        .eq('started', true)
        .is('finished_provisional', false);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000
  });

  const { data: lastCalculation } = useQuery({
    queryKey: ['last-calculation'],
    queryFn: async () => {
      console.log("Fetching last calculation");
      const { data, error } = await supabase
        .from('calculation_logs')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching last calculation:", error);
        throw error;
      }

      console.log("Last calculation data:", data);
      // Return the first item if exists, otherwise null
      return data?.[0] || null;
    },
    refetchInterval: 60000
  });

  const triggerCalculations = async () => {
    try {
      console.log("Triggering calculations");
      const { error } = await supabase.functions.invoke('calculate-points');
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Points calculation triggered successfully",
      });
    } catch (error) {
      console.error('Error triggering calculations:', error);
      toast({
        title: "Error",
        description: "Failed to trigger points calculation",
        variant: "destructive",
      });
    }
  };

  const getLastCalculationTime = () => {
    if (!lastCalculation) return 'Never';
    const minutes = Math.floor((Date.now() - new Date(lastCalculation.start_time).getTime()) / 60000);
    return `${minutes} mins ago`;
  };

  return (
    <main className="flex-1 p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Calculations Engine</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and control calculation processes
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={triggerCalculations}>
            Trigger Calculations
          </Button>
          <LiveStatus />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatusCard
          title="Active Gameweek"
          value={currentEvent ? `GW ${currentEvent.id}` : 'None'}
          status={currentEvent ? 'success' : 'warning'}
          icon={<Activity className="h-4 w-4" />}
          details={[
            { label: "Active Matches", value: activeMatches?.length || 0 },
            { label: "Status", value: currentEvent?.finished ? "Finished" : "In Progress" }
          ]}
        />
        <StatusCard
          title="API Status"
          value="Connected"
          status="success"
          icon={<Database className="h-4 w-4" />}
          details={[
            { label: "Response Time", value: "120ms" },
            { label: "Success Rate", value: "99.9%" }
          ]}
        />
        <StatusCard
          title="Last Calculation"
          value={getLastCalculationTime()}
          status={lastCalculation?.status === "completed" ? "success" : "warning"}
          icon={<Server className="h-4 w-4" />}
          details={[
            { label: "Status", value: lastCalculation?.status || 'Unknown' },
            { label: "Duration", value: lastCalculation ? `${Math.round((new Date(lastCalculation.end_time).getTime() - new Date(lastCalculation.start_time).getTime()) / 1000)}s` : 'N/A' }
          ]}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="points-formula">Points Formula</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <CalculationsManager />
          <RecentActivity />
        </TabsContent>

        <TabsContent value="points-formula">
          <PointsCalculationFormula />
        </TabsContent>
      </Tabs>
    </main>
  );
}