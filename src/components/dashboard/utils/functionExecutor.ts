import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { logFunctionExecution, updateExecutionLog } from "./executionLogger";
import { executeWithRetry, RetryOptions } from './retry/retryExecutor';
import { logRetryMetrics } from './retry/retryMonitor';
import { TestSuite } from '../types/scheduling';
import { runScheduleTests, generateTestReport } from './scheduleTestRunner';

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
    const testSuites: TestSuite[] = [{
      functionName,
      scheduleTypes: options.scheduleType ? [options.scheduleType] : ["time_based", "event_based"]
    }];
    
    const testResults = await runScheduleTests(testSuites);
    const report = generateTestReport(testResults);
    
    console.log(`Test execution completed for ${functionName}:`, report);
    return { success: report.failedTests === 0, data: report };
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

    const endTime = Date.now();
    const duration = endTime - startTime;

    await logRetryMetrics({
      functionName,
      totalAttempts: 1,
      successfulAttempt: 1,
      totalDuration: duration
    });

    if (scheduleId) {
      await updateExecutionLog(scheduleId, 'completed');
    }

    toast({
      title: "Success",
      description: `${functionName} executed successfully`,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error(`Error executing ${functionName}:`, error);
    
    const duration = Date.now() - startTime;
    
    await logRetryMetrics({
      functionName,
      totalAttempts: error.retryCount || 1,
      successfulAttempt: null,
      totalDuration: duration,
      error: error.message
    });

    if (scheduleId) {
      await updateExecutionLog(scheduleId, 'failed', { error: error.message });
    }

    toast({
      title: "Error",
      description: `Failed to execute ${functionName}: ${error.message}`,
      variant: "destructive",
    });

    return { success: false, error };
  }
};