import { APIHealthStatus } from '@/components/monitoring/APIHealthStatus';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { UpcomingExecutions } from '@/components/dashboard/UpcomingExecutions';
import { LiveStatus } from '@/components/dashboard/LiveStatus';
import { OwnershipStats } from '@/components/dashboard/OwnershipStats';
import { MongoDBConnectionTest } from '@/components/dashboard/testing/MongoDBConnectionTest';
import { SidebarProvider } from "@/components/ui/sidebar";
import { BackendSidebarMenu } from "@/components/backend/navigation/BackendSidebarMenu";
import { cn } from "@/lib/utils";
import { useState } from 'react';

export default function BackendDashboard() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarProvider defaultOpen>
        <BackendSidebarMenu onExpandedChange={setIsExpanded} />
        <main className={cn(
          "flex-1 transition-all duration-300 ease-in-out p-6",
        )}>
          <div className={cn(
            "space-y-6",
            "max-w-7xl",
            isExpanded ? "ml-[240px]" : "ml-[60px]"
          )}>
            <div className="container mx-auto p-4 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">System Overview</h1>
                  <p className="text-muted-foreground mt-1">
                    Monitor and manage backend operations
                  </p>
                </div>
                <LiveStatus />
              </div>

              {/* System Health Section - Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <APIHealthStatus />
                <OwnershipStats />
              </div>

              {/* MongoDB Connection Test */}
              <MongoDBConnectionTest />

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <RecentActivity />
                </div>

                {/* Right Column */}
                <div>
                  <UpcomingExecutions />
                </div>
              </div>
            </div>
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
