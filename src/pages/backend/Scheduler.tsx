import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BackendSidebarMenu } from "@/components/backend/navigation/BackendSidebarMenu";
import { FunctionDialogHandler } from "@/components/backend/scheduler/FunctionDialogHandler";
import { SchedulerErrorBoundary } from "@/components/backend/scheduler/SchedulerErrorBoundary";
import { SchedulerHeader } from "./components/scheduler/SchedulerHeader";
import { EdgeFunctionSection } from "./components/scheduler/EdgeFunctionSection";
import { cn } from "@/lib/utils";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";

export default function Scheduler() {
  console.log("Rendering Scheduler page");
  const [newFunctionOpen, setNewFunctionOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

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
              <SchedulerHeader />
              
              {/* Edge Functions Management */}
              <Card className="p-6">
                <EdgeFunctionSection onNewFunction={() => setNewFunctionOpen(true)} />
              </Card>

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