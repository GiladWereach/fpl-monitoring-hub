import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BackendSidebarMenu } from "@/components/backend/navigation/BackendSidebarMenu";
import { FunctionDialogHandler } from "@/components/backend/scheduler/FunctionDialogHandler";
import { SchedulerErrorBoundary } from "@/components/backend/scheduler/SchedulerErrorBoundary";
import { useToast } from "@/hooks/use-toast";
import { SchedulerHeader } from "./components/scheduler/SchedulerHeader";
import { SystemMetricsOverview } from "./components/scheduler/SystemMetricsOverview";
import { ScheduleExecutionMonitor } from "./components/scheduler/ScheduleExecutionMonitor";
import { EdgeFunctionSection } from "./components/scheduler/EdgeFunctionSection";
import { cn } from "@/lib/utils";
import { SidebarProvider } from "@/components/ui/sidebar";

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
          "flex-1 transition-all duration-300 ease-in-out p-6",
          isExpanded ? "ml-[240px]" : "ml-[60px]"
        )}>
          <SchedulerErrorBoundary>
            <div className="space-y-8 max-w-7xl">
              <SchedulerHeader lastUpdated={lastUpdated} onRefresh={() => refetch()} />
              
              {/* System-wide metrics and health overview */}
              <SystemMetricsOverview 
                metrics={metrics} 
                isLoading={isLoading} 
                error={error} 
              />
              
              {/* Schedule execution monitoring and management */}
              <ScheduleExecutionMonitor />
              
              {/* Edge Functions management */}
              <EdgeFunctionSection onNewFunction={() => setNewFunctionOpen(true)} />

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