import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ExecutionList } from "./components/ExecutionList";
import { ScheduleList } from "./components/schedule/ScheduleList";
import { APIHealthStatus } from "@/components/monitoring/APIHealthStatus";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BackendSidebarMenu } from "@/components/backend/navigation/BackendSidebarMenu";
import { FunctionDialogHandler } from "@/components/backend/scheduler/FunctionDialogHandler";
import { SchedulerErrorBoundary } from "@/components/backend/scheduler/SchedulerErrorBoundary";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SchedulerHeader } from "./components/scheduler/SchedulerHeader";
import { StatusCardsGrid } from "./components/scheduler/StatusCardsGrid";
import { EdgeFunctionSection } from "./components/scheduler/EdgeFunctionSection";

export default function Scheduler() {
  const [newFunctionOpen, setNewFunctionOpen] = useState(false);
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

  useEffect(() => {
    const channel = supabase
      .channel('system-metrics')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'api_health_metrics'
        },
        (payload) => {
          console.log('Received real-time update:', payload);
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return (
    <div className="flex h-screen">
      <SidebarProvider defaultOpen>
        <BackendSidebarMenu />
        <div className="flex-1">
          <SchedulerErrorBoundary>
            <div className="container mx-auto p-6 space-y-8 max-w-7xl">
              <SchedulerHeader lastUpdated={lastUpdated} onRefresh={() => refetch()} />
              <StatusCardsGrid metrics={metrics} isLoading={isLoading} error={error} />

              <div className="space-y-8">
                <EdgeFunctionSection onNewFunction={() => setNewFunctionOpen(true)} />

                <Card className="p-6 bg-card">
                  <h2 className="text-lg sm:text-xl font-semibold mb-6">Function Schedules</h2>
                  <ScrollArea className="h-[400px] w-full rounded-md">
                    <div className="min-w-[600px] p-1">
                      <ScheduleList />
                    </div>
                  </ScrollArea>
                </Card>

                <Card className="p-6 bg-card">
                  <h2 className="text-lg sm:text-xl font-semibold mb-6">Recent Executions</h2>
                  <ScrollArea className="h-[400px] w-full rounded-md">
                    <div className="min-w-[600px] p-1">
                      <ExecutionList />
                    </div>
                  </ScrollArea>
                </Card>
              </div>

              <FunctionDialogHandler 
                newFunctionOpen={newFunctionOpen}
                setNewFunctionOpen={setNewFunctionOpen}
              />
            </div>
          </SchedulerErrorBoundary>
        </div>
      </SidebarProvider>
    </div>
  );
}