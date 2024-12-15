import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalculationStats } from "./CalculationStats";
import { RegisteredCalculations } from "./RegisteredCalculations";

export function CalculationsManager() {
  const { data: calculationTypes, isLoading } = useQuery({
    queryKey: ["calculation-types"],
    queryFn: async () => {
      console.log("Fetching calculation types");
      const { data, error } = await supabase
        .from("calculation_types")
        .select("*")
        .order("priority", { ascending: false });

      if (error) {
        console.error("Error fetching calculation types:", error);
        throw error;
      }

      console.log("Calculation types:", data);
      return data;
    },
  });

  const { data: recentLogs } = useQuery({
    queryKey: ["calculation-logs"],
    queryFn: async () => {
      console.log("Fetching recent calculation logs");
      const { data, error } = await supabase
        .from("calculation_logs")
        .select("*")
        .order("start_time", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching calculation logs:", error);
        throw error;
      }

      console.log("Recent logs:", data);
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading calculations...</div>;
  }

  const activeCalculations = calculationTypes?.filter(c => 
    recentLogs?.some(log => 
      log.calculation_type_id === c.id && 
      log.status === "running"
    )
  )?.length || 0;

  const completedToday = recentLogs?.filter(log => 
    log.status === "completed" && 
    new Date(log.end_time).toDateString() === new Date().toDateString()
  )?.length || 0;

  const failedToday = recentLogs?.filter(log => 
    log.status === "error" && 
    new Date(log.start_time).toDateString() === new Date().toDateString()
  )?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Calculations Engine</h2>
      </div>

      <CalculationStats
        activeCalculations={activeCalculations}
        completedToday={completedToday}
        failedToday={failedToday}
      />

      <RegisteredCalculations calculationTypes={calculationTypes || []} />
    </div>
  );
}