import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalculationStats } from "./CalculationStats";
import { RegisteredCalculations } from "./RegisteredCalculations";
import { Activity, AlertCircle, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

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

  const { data: performanceMetrics } = useQuery({
    queryKey: ["performance-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calculation_logs")
        .select("performance_metrics")
        .order("start_time", { ascending: false })
        .limit(100);

      if (error) throw error;
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

  // Calculate average execution time from performance metrics
  const avgExecutionTime = performanceMetrics?.reduce((acc, curr) => {
    return acc + (curr.performance_metrics?.execution_time || 0);
  }, 0) / (performanceMetrics?.length || 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Calculations Engine</h2>
      </div>

      <CalculationStats
        activeCalculations={activeCalculations}
        completedToday={completedToday}
        failedToday={failedToday}
        avgExecutionTime={avgExecutionTime}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Active Calculations</h3>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {recentLogs?.filter(log => log.status === "running").map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-primary animate-pulse" />
                    <div>
                      <p className="font-medium">Calculation #{log.id}</p>
                      <p className="text-sm text-muted-foreground">
                        Started: {new Date(log.start_time).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      {Math.round((Date.now() - new Date(log.start_time).getTime()) / 1000)}s
                    </span>
                  </div>
                </div>
              ))}
              {!recentLogs?.some(log => log.status === "running") && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>No active calculations</span>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        <RegisteredCalculations calculationTypes={calculationTypes || []} />
      </div>
    </div>
  );
}