import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { functions } from "./utils/functionConfigs";
import { executeFetchFunction } from "./utils/functionExecutor";
import { FunctionList } from "./components/FunctionList";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function EdgeFunctionManager() {
  const [loading, setLoading] = useState<string | null>(null);

  const { data: schedules } = useQuery({
    queryKey: ['function-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('function_schedules')
        .select('*')
        .order('function_name');
      
      if (error) throw error;
      return data;
    }
  });

  const handleExecute = async (functionName: string) => {
    setLoading(functionName);
    await executeFetchFunction(functionName);
    setLoading(null);
  };

  const refreshAll = async () => {
    setLoading("all");
    for (const func of functions) {
      try {
        await executeFetchFunction(func.function);
      } catch (error) {
        console.error(`Error in refresh all for ${func.function}:`, error);
      }
    }
    setLoading(null);
  };

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

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="min-w-[600px] pr-4">
          <FunctionList 
            loading={loading} 
            onExecute={handleExecute} 
            schedules={schedules || []}
          />
        </div>
      </ScrollArea>
    </div>
  );
}