import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { createExecutionLog, updateExecutionLog } from "./executionLogger";
import { executeWithRetry, RetryOptions } from './retry/retryHandler';

interface ExecuteFunctionOptions {
  isTest?: boolean;
  scheduleType?: "time_based" | "event_based";
  manualTrigger?: boolean;
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
    
    // First, get the schedule ID for this function
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select('id')
      .eq('function_name', functionName)
      .single();

    if (scheduleError) {
      console.error(`Error fetching schedule for ${functionName}:`, scheduleError);
      throw new Error(`Failed to find schedule for ${functionName}`);
    }

    if (!schedule) {
      console.error(`No schedule found for ${functionName}`);
      throw new Error(`No schedule found for ${functionName}`);
    }

    scheduleId = schedule.id;
    console.log(`Found schedule ID ${scheduleId} for function ${functionName}`);
    
    // Create execution log with valid schedule ID
    const executionLog = await createExecutionLog({
      scheduleId: scheduleId,
      functionName,
      attempt: 1,
      startTime: new Date(),
      executionWindow: {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 30000).toISOString()
      }
    });

    const retryOptions: RetryOptions = {
      maxAttempts: 3,
      backoffStrategy: 'exponential',
      baseDelay: 1000,
      timeout: 30000
    };

    const result = await executeWithRetry(
      async () => {
        const response = await supabase.functions.invoke(functionName, {
          body: {
            scheduled: false,
            manual_trigger: options.manualTrigger || false
          }
        });
        if (response.error) throw response.error;
        return response.data;
      },
      retryOptions,
      functionName
    );

    const executionDuration = Date.now() - startTime;

    if (executionLog?.id) {
      await updateExecutionLog(executionLog.id, 'completed', {
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