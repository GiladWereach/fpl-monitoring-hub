import { useState } from "react";
import { executeFetchFunction } from "../utils/functionExecutor";
import { toast } from "@/hooks/use-toast";

export function useFunctionExecution(refetchSchedules: () => void) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleExecute = async (functionName: string) => {
    setLoading(functionName);
    const executionStartTime = Date.now();
    try {
      console.log(`Executing function: ${functionName}`);
      await executeFetchFunction(functionName);
      const duration = Date.now() - executionStartTime;
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
    const executionStartTime = Date.now();
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

    const duration = Date.now() - executionStartTime;
    
    toast({
      title: "Refresh Complete",
      description: `Completed in ${duration}ms. Success: ${successCount}, Failed: ${failureCount}`,
      variant: failureCount > 0 ? "destructive" : "default",
    });
    
    setLoading(null);
    refetchSchedules();
  };

  return { loading, handleExecute, refreshAll };
}