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
import { ScheduleOverrideManager } from "./schedule/ScheduleOverrideManager";

export function EdgeFunctionManager() {
  const [loading, setLoading] = useState<string | null>(null);

  const { data: schedules } = useQuery({
    queryKey: ['function-schedules'],
    queryFn: async () => {
      console.log('Fetching function schedules');
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('function_name');
      
      if (error) {
        console.error('Error fetching schedules:', error);
        throw error;
      }
      
      console.log('Fetched schedules:', data);
      return data;
    }
  });

  const handleExecute = async (functionName: string) => {
    setLoading(functionName);
    try {
      console.log(`Executing function: ${functionName}`);
      await executeFetchFunction(functionName);
      console.log(`Successfully executed function: ${functionName}`);
    } catch (error) {
      console.error(`Error executing function ${functionName}:`, error);
    } finally {
      setLoading(null);
    }
  };

  const refreshAll = async () => {
    setLoading("all");
    for (const func of functions) {
      try {
        console.log(`Refreshing function: ${func.function}`);
        await executeFetchFunction(func.function);
      } catch (error) {
        console.error(`Error in refresh all for ${func.function}:`, error);
      }
    }
    setLoading(null);
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
          <RefreshCw className="h-4 w-4" />
          Refresh All
        </Button>
      </div>

      <ScheduleOverrideManager />

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