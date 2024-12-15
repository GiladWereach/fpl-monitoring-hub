import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calculator, Clock, Activity } from "lucide-react";
import { StatusCard } from "./StatusCard";

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatusCard
          title="Active Calculations"
          value={activeCalculations.toString()}
          status="info"
          icon={<Calculator className="h-4 w-4" />}
        />
        <StatusCard
          title="Completed Today"
          value={completedToday.toString()}
          status="success"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatusCard
          title="Failed Today"
          value={failedToday.toString()}
          status="error"
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      <div className="glass-card p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Registered Calculations</h3>
        <div className="space-y-4">
          {calculationTypes?.map((calc) => (
            <div
              key={calc.id}
              className="flex items-center justify-between p-4 bg-background/50 rounded-lg"
            >
              <div>
                <h4 className="font-medium">{calc.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {calc.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Priority: {calc.priority}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    calc.is_real_time
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {calc.is_real_time ? "Real-time" : "Batch"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}