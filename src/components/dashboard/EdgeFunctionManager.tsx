import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScheduleCategory } from "./types/scheduleTypes";
import { functions, getCategoryDescription } from "./utils/functionConfigs";
import { executeFetchFunction } from "./utils/functionExecutor";
import { toast } from "@/hooks/use-toast";
import { FunctionExecutionStatus } from "./components/FunctionExecutionStatus";
import { CategorySection } from "./components/CategorySection";

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
    refetchInterval: 10000
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
      <FunctionExecutionStatus loading={loading} onRefreshAll={refreshAll} />

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="min-w-[600px] pr-4 space-y-8">
          {categories.map(category => {
            const categoryFunctions = functions.filter(f => f.scheduleConfig.category === category);
            if (categoryFunctions.length === 0) return null;

            return (
              <CategorySection
                key={category}
                category={category}
                description={getCategoryDescription(category)}
                functions={categoryFunctions}
                loading={loading}
                onExecute={handleExecute}
                schedules={schedules || []}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}