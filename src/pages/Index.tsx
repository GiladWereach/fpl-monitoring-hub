import { Activity, Database, Server } from "lucide-react";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          <div className="mt-8 glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span>API Request Completed</span>
                  </div>
                  <span className="text-sm text-muted-foreground">2m ago</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;