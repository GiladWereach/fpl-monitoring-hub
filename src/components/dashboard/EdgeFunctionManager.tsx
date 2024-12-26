import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { functions, getCategoryDescription } from "./utils/functionConfigs";
import { executeFetchFunction } from "./utils/functionExecutor";
import { FunctionList } from "./components/FunctionList";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScheduleCategory } from "./types/scheduleTypes";
import { toast } from "@/hooks/use-toast";

export function EdgeFunctionManager() {
  const [loading, setLoading] = useState<string | null>(null);

  const { data: schedules, refetch: refetchSchedules } = useQuery({
    queryKey: ['function-schedules'],
    queryFn: async () => {
      console.log('Fetching function schedules');
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          schedule_execution_logs (
            id,
            status,
            started_at,
            completed_at,
            error_details,
            execution_duration_ms
          )
        `)
        .order('function_name');
      
      if (error) {
        console.error('Error fetching schedules:', error);
        throw error;
      }
      
      console.log('Fetched schedules:', data);
      return data;
    },
    refetchInterval: 10000 // Refresh every 10 seconds during active development
  });

  const handleExecute = async (functionName: string) => {
    setLoading(functionName);
    try {
      console.log(`Executing function: ${functionName}`);
      const startTime = Date.now();
      await executeFetchFunction(functionName);
      const duration = Date.now() - startTime;
      console.log(`Successfully executed ${functionName} in ${duration}ms`);
      
      toast({
        title: "Function Executed",
        description: `Successfully executed ${functionName} in ${duration}ms`,
      });
      
      // Refresh schedules to show updated execution status
      await refetchSchedules();
    } catch (error) {
      console.error(`Error executing function ${functionName}:`, error);
      toast({
        title: "Execution Error",
        description: `Failed to execute ${functionName}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const refreshAll = async () => {
    setLoading("all");
    const startTime = Date.now();
    let successCount = 0;
    let failureCount = 0;

    for (const func of functions) {
      try {
        console.log(`Refreshing function: ${func.function}`);
        await executeFetchFunction(func.function);
        successCount++;
      } catch (error) {
        console.error(`Error in refresh all for ${func.function}:`, error);
        failureCount++;
      }
    }

    const duration = Date.now() - startTime;
    
    toast({
      title: "Refresh Complete",
      description: `Completed in ${duration}ms. Success: ${successCount}, Failed: ${failureCount}`,
      variant: failureCount > 0 ? "destructive" : "default",
    });
    
    setLoading(null);
    refetchSchedules();
  };

  const categories: ScheduleCategory[] = ['core_data', 'match_dependent', 'system', 'analytics'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Edge Functions Manager</h2>
        <Button
          onClick={refreshAll}
          disabled={loading !== null}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading === "all" ? "animate-spin" : ""}`} />
          Refresh All
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="min-w-[600px] pr-4 space-y-8">
          {categories.map(category => {
            const categoryFunctions = functions.filter(f => f.scheduleConfig.category === category);
            if (categoryFunctions.length === 0) return null;

            return (
              <div key={category} className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-semibold capitalize">{category.replace('_', ' ')}</h3>
                  <p className="text-sm text-muted-foreground">{getCategoryDescription(category)}</p>
                </div>
                <FunctionList 
                  loading={loading} 
                  onExecute={handleExecute} 
                  schedules={schedules || []}
                  functions={categoryFunctions}
                />
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}