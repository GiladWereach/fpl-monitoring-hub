import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import { functions } from "./utils/functionConfigs";
import { logFunctionExecution, updateExecutionLog } from "./utils/executionLogger";
import { FunctionCard } from "./components/FunctionCard";

export function EdgeFunctionManager() {
  const [loading, setLoading] = useState<string | null>(null);

  const invokeFetchFunction = async (functionName: string) => {
    const started_at = new Date().toISOString();
    let scheduleId: string | undefined;

    try {
      setLoading(functionName);
      scheduleId = await logFunctionExecution(functionName, started_at);
      
      const { data, error } = await supabase.functions.invoke(functionName);
      
      if (error) throw error;
      
      if (scheduleId) {
        await updateExecutionLog(scheduleId, true);
      }

      toast({
        title: "Success",
        description: `${functionName} executed successfully`,
      });
    } catch (error) {
      console.error(`Error invoking ${functionName}:`, error);
      
      if (scheduleId) {
        await updateExecutionLog(scheduleId, false, error.message);
      }

      toast({
        title: "Error",
        description: `Failed to execute ${functionName}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const refreshAll = async () => {
    setLoading("all");
    for (const func of functions) {
      try {
        await invokeFetchFunction(func.function);
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {functions.map((func) => (
          <FunctionCard
            key={func.function}
            name={func.name}
            functionName={func.function}
            loading={loading}
            onExecute={invokeFetchFunction}
          />
        ))}
      </div>
    </div>
  );
}