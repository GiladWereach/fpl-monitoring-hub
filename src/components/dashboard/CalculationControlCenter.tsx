import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export function CalculationControlCenter() {
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: calculationTypes } = useQuery({
    queryKey: ["calculation-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calculation_types")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const triggerCalculation = async (calculationType: string) => {
    try {
      setIsCalculating(true);
      const { error } = await supabase.functions.invoke("calculate-points");
      
      if (error) throw error;
      
      toast.success(`Successfully triggered ${calculationType} calculation`);
    } catch (error) {
      console.error("Error triggering calculation:", error);
      toast.error("Failed to trigger calculation");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Calculation Control Center</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {calculationTypes?.map((calc) => (
          <Card key={calc.id} className="p-4">
            <h3 className="font-semibold mb-2">{calc.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {calc.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm">Priority: {calc.priority}</span>
              <Button
                onClick={() => triggerCalculation(calc.name)}
                disabled={isCalculating}
              >
                Run Calculation
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}