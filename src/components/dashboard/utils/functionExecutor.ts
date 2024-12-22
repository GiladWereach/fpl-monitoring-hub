import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { logFunctionExecution, updateExecutionLog } from "./executionLogger";
import { logAPIError, updateAPIHealthMetrics } from "@/utils/api/errorHandling";
import { APIError } from "@/utils/api/errorHandling";
import { 
  handleSchedulerError, 
  calculateBackoff, 
  cleanupResources,
  SchedulerError,
  errorClassification 
} from "@/utils/errorHandling";

interface EdgeFunctionResponse {
  data: any;
  error: Error | null;
}

export const executeFetchFunction = async (functionName: string) => {
  const started_at = new Date().toISOString();
  let scheduleId: string | undefined;
  const startTime = Date.now();
  let attempt = 1;
  const maxAttempts = 3; // This could be configurable

  try {
    console.log(`Executing function: ${functionName}`);
    scheduleId = await logFunctionExecution(functionName, started_at);
    
    if (!scheduleId) {
      throw new SchedulerError({
        ...errorClassification.VALIDATION_ERROR,
        message: "Failed to create or find schedule for execution logging"
      });
    }

    while (attempt <= maxAttempts) {
      try {
        // Get current metrics first
        const { data: currentMetrics } = await supabase
          .from('api_health_metrics')
          .select('*')
          .eq('endpoint', functionName)
          .maybeSingle();

        const response = await Promise.race([
          supabase.functions.invoke<EdgeFunctionResponse>(functionName),
          new Promise((_, reject) => 
            setTimeout(() => reject(new SchedulerError(errorClassification.TIMEOUT_ERROR)), 30000)
          )
        ]);
        
        if (response.error) throw response.error;
        
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Calculate new metrics
        const newMetrics = {
          endpoint: functionName,
          success_count: (currentMetrics?.success_count || 0) + 1,
          error_count: currentMetrics?.error_count || 0,
          avg_response_time: currentMetrics 
            ? ((currentMetrics.avg_response_time * currentMetrics.success_count) + duration) / (currentMetrics.success_count + 1)
            : duration,
          last_success_time: new Date().toISOString(),
          last_error_time: currentMetrics?.last_error_time,
          error_pattern: currentMetrics?.error_pattern || {}
        };

        // Update metrics
        const { error: metricsError } = await supabase
          .from('api_health_metrics')
          .upsert(newMetrics);

        if (metricsError) {
          console.error(`Error updating metrics for ${functionName}:`, metricsError);
        }
        
        if (scheduleId) {
          await updateExecutionLog(scheduleId, true);
        }

        await cleanupResources(functionName);

        toast({
          title: "Success",
          description: `${functionName} executed successfully`,
        });

        return { success: true, data: response.data };
      } catch (error) {
        await handleSchedulerError(error, { functionName, attempt, maxAttempts });
        
        // If we get here, the error was retryable and we haven't exceeded maxAttempts
        const backoffDelay = calculateBackoff(attempt, 'exponential');
        console.log(`Retrying ${functionName} after ${backoffDelay}ms (attempt ${attempt}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        
        attempt++;
      }
    }

    // If we get here, we've exhausted all retries
    throw new SchedulerError({
      code: 'MAX_RETRIES_EXCEEDED',
      message: `Failed to execute ${functionName} after ${maxAttempts} attempts`,
      severity: 'high',
      retryable: false
    });
  } catch (error) {
    console.error(`Error executing ${functionName}:`, error);
    
    // Get current metrics for error handling
    const { data: currentMetrics } = await supabase
      .from('api_health_metrics')
      .select('*')
      .eq('endpoint', functionName)
      .maybeSingle();

    // Ensure we have a valid error_pattern object
    const currentErrorPattern = typeof currentMetrics?.error_pattern === 'object' && currentMetrics?.error_pattern !== null 
      ? currentMetrics.error_pattern 
      : {};

    // Update metrics for error case
    const newMetrics = {
      endpoint: functionName,
      success_count: currentMetrics?.success_count || 0,
      error_count: (currentMetrics?.error_count || 0) + 1,
      avg_response_time: currentMetrics?.avg_response_time || 0,
      last_success_time: currentMetrics?.last_success_time,
      last_error_time: new Date().toISOString(),
      error_pattern: {
        ...currentErrorPattern,
        last_error: error instanceof Error ? error.message : String(error)
      }
    };

    await supabase
      .from('api_health_metrics')
      .upsert(newMetrics);

    const apiError: APIError = {
      type: 'SERVER_ERROR',
      message: error instanceof Error ? error.message : String(error),
      endpoint: functionName,
      statusCode: error instanceof SchedulerError ? 500 : 500,
      retryCount: attempt - 1,
      requestParams: {}
    };

    await logAPIError(apiError);
    
    if (scheduleId) {
      await updateExecutionLog(scheduleId, false, error instanceof Error ? error.message : String(error));
    }

    await cleanupResources(functionName);

    toast({
      title: "Error",
      description: `Failed to execute ${functionName}: ${error instanceof Error ? error.message : String(error)}`,
      variant: "destructive",
    });

    return { success: false, error };
  }
};