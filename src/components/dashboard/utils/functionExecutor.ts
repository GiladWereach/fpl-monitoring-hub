import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { logFunctionExecution, updateExecutionLog } from "./executionLogger";
import { executeWithRetry, RetryOptions } from './retry/retryHandler';

interface ExecuteFunctionOptions {
  isTest?: boolean;
  scheduleType?: "time_based" | "event_based";
}

export const executeFetchFunction = async (
  functionName: string, 
  options: ExecuteFunctionOptions = {}
): Promise<{ success: boolean; data?: any; error?: Error }> => {
  const started_at = new Date().toISOString();
  let scheduleId: string | undefined;
  const startTime = Date.now();

  if (options.isTest) {
    console.log(`Running test execution for ${functionName}`);
    return { success: true, data: { test: true } };
  }

  try {
    console.log(`Executing function: ${functionName}`);
    scheduleId = await logFunctionExecution(functionName, started_at);

    if (!scheduleId) {
      throw new Error("Failed to create or find schedule for execution logging");
    }

    const retryOptions: RetryOptions = {
      maxAttempts: 3,
      backoffStrategy: 'exponential',
      baseDelay: 1000,
      timeout: 30000
    };

    const result = await executeWithRetry(
      async () => {
        const response = await supabase.functions.invoke(functionName);
        if (response.error) throw response.error;
        return response.data;
      },
      retryOptions,
      functionName
    );

    const executionDuration = Date.now() - startTime;

    if (scheduleId) {
      await updateExecutionLog(scheduleId, 'completed', {
        duration: executionDuration
      });
    }

    toast({
      title: "Success",
      description: `${functionName} executed successfully`,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error(`Error executing ${functionName}:`, error);
    
    if (scheduleId) {
      await updateExecutionLog(scheduleId, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
    }

    toast({
      title: "Error",
      description: `Failed to execute ${functionName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      variant: "destructive",
    });

    return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};