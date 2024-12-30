import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BackendSidebarMenu } from "@/components/backend/navigation/BackendSidebarMenu";
import { FunctionDialogHandler } from "@/components/backend/scheduler/FunctionDialogHandler";
import { SchedulerErrorBoundary } from "@/components/backend/scheduler/SchedulerErrorBoundary";
import { useToast } from "@/hooks/use-toast";
import { SchedulerHeader } from "./components/scheduler/SchedulerHeader";
import { MonitoringDashboard } from "@/components/dashboard/monitoring/MonitoringDashboard";
import { MatchWindowMonitor } from "@/components/dashboard/monitoring/MatchWindowMonitor";
import { ScheduleAdjustmentMonitor } from "@/components/dashboard/monitoring/ScheduleAdjustmentMonitor";
import { EdgeFunctionSection } from "./components/scheduler/EdgeFunctionSection";
import { cn } from "@/lib/utils";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";

export default function Scheduler() {
  console.log("Rendering Scheduler page");
  const [newFunctionOpen, setNewFunctionOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const { toast } = useToast();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { data: metrics, isLoading, error, refetch } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      console.log('Fetching system metrics');
      const { data: healthData, error } = await supabase.rpc('get_aggregated_metrics');
      
      if (error) {
        console.error('Error fetching metrics:', error);
        throw error;
      }
      
      console.log('Fetched metrics:', healthData);
      setLastUpdated(new Date());
      return healthData;
    },
    refetchInterval: 30000,
    meta: {
      onError: () => {
        toast({
          title: "Error fetching metrics",
          description: "Failed to load system metrics. Please try again later.",
          variant: "destructive",
        });
      }
    }
  });

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarProvider>
        <BackendSidebarMenu onExpandedChange={setIsExpanded} />
        <main className={cn(
          "flex-1 transition-all duration-300 ease-in-out p-8",
          isExpanded ? "ml-[240px]" : "ml-[60px]"
        )}>
          <SchedulerErrorBoundary>
            <div className="space-y-8 max-w-7xl">
              <SchedulerHeader lastUpdated={lastUpdated} onRefresh={() => refetch()} />
              
              {/* Primary Monitoring Dashboard */}
              <Card className="p-6 bg-card/50 shadow-sm">
                <MonitoringDashboard />
              </Card>
              
              {/* Match Window and Schedule Adjustment Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-2">Match Window Status</h3>
                  <Card className="p-6 bg-card/50 shadow-sm">
                    <MatchWindowMonitor />
                  </Card>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-2">Schedule Adjustments</h3>
                  <Card className="p-6 bg-card/50 shadow-sm">
                    <ScheduleAdjustmentMonitor />
                  </Card>
                </div>
              </div>
              
              {/* Edge Functions Management */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Edge Functions</h3>
                <EdgeFunctionSection onNewFunction={() => setNewFunctionOpen(true)} />
              </div>

              <FunctionDialogHandler 
                newFunctionOpen={newFunctionOpen}
                setNewFunctionOpen={setNewFunctionOpen}
              />
            </div>
          </SchedulerErrorBoundary>
        </main>
      </SidebarProvider>
    </div>
  );
}