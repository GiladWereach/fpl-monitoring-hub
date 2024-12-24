import { useState } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function BackendScheduler() {
  const [newFunctionOpen, setNewFunctionOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar>
          <BackendSidebarMenu />
        </Sidebar>

        <div className="flex-1 overflow-auto">
          <SchedulerErrorBoundary>
            <div className="container mx-auto p-6 space-y-8 animate-fade-in">
              <ScheduleHeader onNewFunction={() => setNewFunctionOpen(true)} />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="transition-all duration-200 hover:scale-[1.02]">
                        <APIHealthStatus />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[300px]">
                      <p>Monitor API health and performance metrics in real-time</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

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