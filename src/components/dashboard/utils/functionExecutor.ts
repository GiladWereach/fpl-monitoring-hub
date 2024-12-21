import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { logFunctionExecution, updateExecutionLog } from "./executionLogger";
import { logAPIError, updateAPIHealthMetrics } from "@/utils/api/errorHandling";
import { APIError } from "@/utils/api/errorHandling";

export const executeFetchFunction = async (functionName: string) => {
  const started_at = new Date().toISOString();
  let scheduleId: string | undefined;
  const startTime = Date.now();

  try {
    console.log(`Executing function: ${functionName}`);
    scheduleId = await logFunctionExecution(functionName, started_at);
    
    if (!scheduleId) {
      throw new Error("Failed to create or find schedule for execution logging");
    }

    // Get current metrics first
    const { data: currentMetrics } = await supabase
      .from('api_health_metrics')
      .select('*')
      .eq('endpoint', functionName)
      .maybeSingle();

    const { data, error } = await supabase.functions.invoke(functionName);
    
    if (error) {
      console.error(`Error executing ${functionName}:`, error);
      throw error;
    }
    
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

    toast({
      title: "Success",
      description: `${functionName} executed successfully`,
    });

    return { success: true, data };
  } catch (error) {
    console.error(`Error executing ${functionName}:`, error);
    
    // Get current metrics for error handling
    const { data: currentMetrics } = await supabase
      .from('api_health_metrics')
      .select('*')
      .eq('endpoint', functionName)
      .maybeSingle();

    // Update metrics for error case
    const newMetrics = {
      endpoint: functionName,
      success_count: currentMetrics?.success_count || 0,
      error_count: (currentMetrics?.error_count || 0) + 1,
      avg_response_time: currentMetrics?.avg_response_time || 0,
      last_success_time: currentMetrics?.last_success_time,
      last_error_time: new Date().toISOString(),
      error_pattern: {
        ...(currentMetrics?.error_pattern || {}),
        last_error: error.message
      }
    };

    await supabase
      .from('api_health_metrics')
      .upsert(newMetrics);

    const apiError: APIError = {
      type: 'SERVER_ERROR',
      message: error.message,
      endpoint: functionName,
      statusCode: error.status || 500,
      retryCount: 0,
      requestParams: {}
    };

    await logAPIError(apiError);
    
    if (scheduleId) {
      await updateExecutionLog(scheduleId, false, error.message);
    }

    toast({
      title: "Error",
      description: `Failed to execute ${functionName}: ${error.message}`,
      variant: "destructive",
    });

    return { success: false, error };
  }
};