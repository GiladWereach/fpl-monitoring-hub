import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EdgeFunctionManager } from "./EdgeFunctionManager";
import { PricePredictionTesting } from "./testing/PricePredictionTesting";

export function CalculationControlCenter() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="functions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="functions">Edge Functions</TabsTrigger>
          <TabsTrigger value="testing">Testing & Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="functions">
          <EdgeFunctionManager />
        </TabsContent>

        <TabsContent value="testing">
          <PricePredictionTesting />
        </TabsContent>
      </Tabs>
    </div>
  );
}