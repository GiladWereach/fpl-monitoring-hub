import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalculationsManager } from "./CalculationsManager";
import { PointsCalculationFormula } from "./PointsCalculationFormula";
import { PriceChangeMonitor } from "./PriceChangeMonitor";

export function CalculationControlCenter() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="calculations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calculations">Active Calculations</TabsTrigger>
          <TabsTrigger value="points">Points Formula</TabsTrigger>
          <TabsTrigger value="prices">Price Changes</TabsTrigger>
        </TabsList>

        <TabsContent value="calculations">
          <CalculationsManager />
        </TabsContent>

        <TabsContent value="points">
          <PointsCalculationFormula />
        </TabsContent>

        <TabsContent value="prices">
          <PriceChangeMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
}