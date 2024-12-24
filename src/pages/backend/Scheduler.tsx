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

export default function BackendScheduler() {
  const [newFunctionOpen, setNewFunctionOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar>
          <BackendSidebarMenu />
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

            <FunctionDialogHandler 
              newFunctionOpen={newFunctionOpen}
              setNewFunctionOpen={setNewFunctionOpen}
            />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}