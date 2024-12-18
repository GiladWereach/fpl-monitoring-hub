import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataCollection } from "./sections/DataCollection";
import { ProcessingValidation } from "./sections/ProcessingValidation";
import { PredictionAccuracy } from "./sections/PredictionAccuracy";
import { SystemHealth } from "./sections/SystemHealth";

export function PricePredictionTesting() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Price Prediction System Testing</h2>
      
      <Tabs defaultValue="collection" className="space-y-4">
        <TabsList>
          <TabsTrigger value="collection">Data Collection</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="collection">
          <DataCollection />
        </TabsContent>

        <TabsContent value="processing">
          <ProcessingValidation />
        </TabsContent>

        <TabsContent value="predictions">
          <PredictionAccuracy />
        </TabsContent>

        <TabsContent value="health">
          <SystemHealth />
        </TabsContent>
      </Tabs>
    </div>
  );
}