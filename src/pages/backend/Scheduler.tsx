import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ExecutionList } from "./components/ExecutionList";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ScheduleHeader } from "./components/schedule/ScheduleHeader";
import { ScheduleList } from "./components/schedule/ScheduleList";
import { NewFunctionDialog } from "./components/schedule/NewFunctionDialog";
import { APIHealthStatus } from "@/components/monitoring/APIHealthStatus";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EdgeFunctionManager } from "@/components/dashboard/EdgeFunctionManager";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarProvider 
} from "@/components/ui/sidebar";
import { 
  Home, 
  Settings, 
  Activity, 
  Calendar, 
  Database,
  ChevronRight,
  Timer
} from "lucide-react";
import { Link } from "react-router-dom";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const menuItems = [
  { title: "Dashboard", icon: Home, path: "/backend/dashboard" },
  { title: "Scheduler", icon: Calendar, path: "/backend/scheduler" },
  { title: "Logs", icon: Activity, path: "/backend/logs" },
  { title: "Calculations", icon: Database, path: "/backend/calculations" },
  { title: "Settings", icon: Settings, path: "/backend/settings" }
];

const monitoringItems = [
  { title: "Live Gameweek", icon: Timer, path: "/gameweek-live" }
];

export default function BackendScheduler() {
  const [newFunctionOpen, setNewFunctionOpen] = useState(false);
  const [isMonitoringOpen, setIsMonitoringOpen] = useState(true);

  const handleNewFunction = async (data: {
    name: string;
    groupId: string;
  }) => {
    try {
      console.log("Creating new function schedule:", data);
      
      const { data: group, error: groupError } = await supabase
        .from('function_schedules')
        .select('*')
        .eq('group_id', data.groupId)
        .maybeSingle();

      if (groupError) throw groupError;

      const baseSettings = group || {
        frequency_type: 'fixed_interval',
        base_interval_minutes: 5,
        status: 'paused',
        max_concurrent_executions: 3,
        timeout_seconds: 30,
        retry_count: 3,
        retry_delay_seconds: 60
      };

      const { error } = await supabase
        .from('function_schedules')
        .insert({
          function_name: data.name,
          group_id: data.groupId,
          frequency_type: baseSettings.frequency_type,
          base_interval_minutes: baseSettings.base_interval_minutes,
          status: baseSettings.status,
          max_concurrent_executions: baseSettings.max_concurrent_executions,
          timeout_seconds: baseSettings.timeout_seconds,
          retry_count: baseSettings.retry_count,
          retry_delay_seconds: baseSettings.retry_delay_seconds
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "New function schedule created",
      });
      setNewFunctionOpen(false);
    } catch (error) {
      console.error("Error creating function schedule:", error);
      toast({
        title: "Error",
        description: "Failed to create function schedule",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Backend</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link to={item.path} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <Collapsible
                open={isMonitoringOpen}
                onOpenChange={setIsMonitoringOpen}
                className="w-full"
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between p-2 hover:bg-accent rounded-md">
                  <span className="text-sm font-medium">Monitoring</span>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isMonitoringOpen ? "rotate-90" : ""
                    }`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {monitoringItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <Link to={item.path} className="flex items-center gap-2">
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-8 animate-fade-in">
            <ScheduleHeader onNewFunction={() => setNewFunctionOpen(true)} />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <APIHealthStatus />
            </div>

            <Card className="p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-6">Edge Functions</h2>
              <ScrollArea className="h-[400px] w-full">
                <div className="min-w-[600px]">
                  <EdgeFunctionManager />
                </div>
              </ScrollArea>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-6">Function Schedules</h2>
              <ScrollArea className="h-[400px] w-full">
                <div className="min-w-[600px]">
                  <ScheduleList />
                </div>
              </ScrollArea>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-6">Recent Executions</h2>
              <ScrollArea className="h-[400px] w-full">
                <div className="min-w-[600px]">
                  <ExecutionList />
                </div>
              </ScrollArea>
            </Card>

            <NewFunctionDialog
              open={newFunctionOpen}
              onOpenChange={setNewFunctionOpen}
              onSubmit={handleNewFunction}
            />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}