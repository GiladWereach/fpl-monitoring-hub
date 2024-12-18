import { Card } from "@/components/ui/card";
import { PricePredictions } from "./PricePredictions";
import { RecentPriceChanges } from "./RecentPriceChanges";
import { PredictionValidation } from "./PredictionValidation";
import { PricePredictionPipeline } from "./testing/PricePredictionPipeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function PriceChangeMonitor() {
  return (
    <div className="space-y-6">
      <PricePredictionPipeline />
      
      <Tabs defaultValue="predictions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="changes">Recent Changes</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions">
          <PricePredictions />
        </TabsContent>

        <TabsContent value="changes">
          <RecentPriceChanges />
        </TabsContent>

        <TabsContent value="validation">
          <PredictionValidation />
        </TabsContent>
      </Tabs>
    </div>
  );
}