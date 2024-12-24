import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ExecutionList } from "./components/ExecutionList";
import { ScheduleHeader } from "./components/schedule/ScheduleHeader";
import { ScheduleList } from "./components/schedule/ScheduleList";
import { APIHealthStatus } from "@/components/monitoring/APIHealthStatus";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EdgeFunctionManager } from "@/components/dashboard/EdgeFunctionManager";
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import { BackendSidebarMenu } from "@/components/backend/navigation/BackendSidebarMenu";
import { FunctionDialogHandler } from "@/components/backend/scheduler/FunctionDialogHandler";
import { SchedulerErrorBoundary } from "@/components/backend/scheduler/SchedulerErrorBoundary";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { Database, Activity, AlertTriangle, Server, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export default function BackendScheduler() {
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

  // Set up real-time subscription
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

  const statusCards = [
    {
      title: "Database Status",
      value: "Connected",
      status: "success" as const,
      icon: <Database className="h-4 w-4" />,
      tooltip: "Current database connection status"
    },
    {
      title: "Edge Functions",
      value: `${metrics?.length || 0} Active`,
      status: "info" as const,
      icon: <Server className="h-4 w-4" />,
      tooltip: "Number of active edge functions"
    },
    {
      title: "System Health",
      value: "Healthy",
      status: "success" as const,
      icon: <Activity className="h-4 w-4" />,
      tooltip: "Overall system health status"
    },
    {
      title: "System Errors",
      value: "0",
      status: "warning" as const,
      icon: <AlertTriangle className="h-4 w-4" />,
      tooltip: "Number of system errors in the last 24 hours"
    },
  ];

  const renderStatusCards = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-1/3" />
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusCards.map((card, index) => (
            <StatusCard
              key={index}
              {...card}
              value="Error loading"
              status="error"
            />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="transition-transform hover:scale-[1.02]">
                  <StatusCard {...card} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{card.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar>
          <BackendSidebarMenu />
        </Sidebar>

        <div className="flex-1 overflow-auto">
          <SchedulerErrorBoundary>
            <div className="container mx-auto p-6 space-y-8 animate-fade-in">
              <div className="flex justify-between items-center">
                <ScheduleHeader onNewFunction={() => setNewFunctionOpen(true)} />
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>
              
              {renderStatusCards()}

              <Card className="p-6 bg-card shadow-md">
                <h2 className="text-lg sm:text-xl font-semibold mb-6 flex items-center gap-2">
                  Edge Functions
                </h2>
                <ScrollArea className="h-[400px] w-full rounded-md">
                  <div className="min-w-[600px] p-1">
                    <EdgeFunctionManager />
                  </div>
                </ScrollArea>
              </Card>

              <Card className="p-6 bg-card shadow-md">
                <h2 className="text-lg sm:text-xl font-semibold mb-6 flex items-center gap-2">
                  Function Schedules
                </h2>
                <ScrollArea className="h-[400px] w-full rounded-md">
                  <div className="min-w-[600px] p-1">
                    <ScheduleList />
                  </div>
                </ScrollArea>
              </Card>

              <Card className="p-6 bg-card shadow-md">
                <h2 className="text-lg sm:text-xl font-semibold mb-6 flex items-center gap-2">
                  Recent Executions
                </h2>
                <ScrollArea className="h-[400px] w-full rounded-md">
                  <div className="min-w-[600px] p-1">
                    <ExecutionList />
                  </div>
                </ScrollArea>
              </Card>

              <FunctionDialogHandler 
                newFunctionOpen={newFunctionOpen}
                setNewFunctionOpen={setNewFunctionOpen}
              />
            </div>
          </SchedulerErrorBoundary>
        </div>
      </div>
    </SidebarProvider>
  );
}