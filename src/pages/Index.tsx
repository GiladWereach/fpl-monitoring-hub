import { Activity, Database, Server, Circle } from "lucide-react";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/AppSidebar";
import { EdgeFunctionManager } from "@/components/dashboard/EdgeFunctionManager";
import { LiveStatus } from "@/components/dashboard/LiveStatus";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { CalculationsManager } from "@/components/dashboard/CalculationsManager";

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8 animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">System Overview</h1>
              <p className="text-muted-foreground mt-1">
                Monitor your system's health and performance
              </p>
            </div>
            <SidebarTrigger />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatusCard
              title="Live Updates"
              value="Active"
              status="info"
              icon={<Circle className="h-4 w-4" />}
              indicator={<LiveStatus showLabel={false} />}
            />
            <StatusCard
              title="API Health"
              value="98.5%"
              status="success"
              icon={<Activity className="h-4 w-4" />}
            />
            <StatusCard
              title="Database Status"
              value="Connected"
              status="success"
              icon={<Database className="h-4 w-4" />}
            />
            <StatusCard
              title="Edge Functions"
              value="3 Active"
              status="info"
              icon={<Server className="h-4 w-4" />}
            />
          </div>

          <div className="mt-8">
            <CalculationsManager />
          </div>

          <div className="mt-8">
            <EdgeFunctionManager />
          </div>

          <div className="mt-8">
            <RecentActivity />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;