import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function PricePredictionPipeline() {
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const runPipeline = async () => {
    setIsRunning(true);
    try {
      // Step 1: Collect transfer data
      console.log("Starting transfer data collection...");
      const { data: transferData, error: transferError } = await supabase.functions.invoke('track-transfer-history');
      if (transferError) throw transferError;
      console.log("Transfer data collected:", transferData);

      // Step 2: Process transfer data
      console.log("Processing transfer data...");
      const { data: processedData, error: processError } = await supabase.functions.invoke('process-transfer-data');
      if (processError) throw processError;
      console.log("Transfer data processed:", processedData);

      // Step 3: Generate predictions
      console.log("Generating predictions...");
      const { data: predictions, error: predictionError } = await supabase.functions.invoke('predict-price-changes');
      if (predictionError) throw predictionError;
      console.log("Predictions generated:", predictions);

      toast({
        title: "Pipeline completed successfully",
        description: "All steps completed. Check console for details.",
      });
    } catch (error) {
      console.error("Pipeline error:", error);
      toast({
        title: "Pipeline error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Price Prediction Pipeline Test</h3>
        <Button 
          onClick={runPipeline} 
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Pipeline...
            </>
          ) : (
            'Run Pipeline'
          )}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        This will run the complete price prediction pipeline:
        1. Collect transfer data
        2. Process transfer data
        3. Generate predictions
      </p>
    </Card>
  );
}