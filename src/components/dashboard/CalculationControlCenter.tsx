import { LiveStatus } from "./LiveStatus";
import { CalculationsManager } from "./CalculationsManager";
import { RecentActivity } from "./RecentActivity";
import { PointsCalculationFormula } from "./PointsCalculationFormula";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CalculationControlCenter() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8 animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Calculations Engine</h1>
              <p className="text-muted-foreground mt-1">
                Monitor and control calculation processes
              </p>
            </div>
            <div className="flex items-center gap-4">
              <LiveStatus />
              <SidebarTrigger />
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="points-formula">Points Formula</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <CalculationsManager />
              <RecentActivity />
            </TabsContent>

            <TabsContent value="points-formula">
              <PointsCalculationFormula />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
}