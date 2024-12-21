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

    const { data, error } = await supabase.functions.invoke(functionName);
    
    if (error) throw error;
    
    const endTime = Date.now();
    await updateAPIHealthMetrics(functionName, true, endTime - startTime);
    
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
    
    const apiError: APIError = {
      type: 'SERVER_ERROR',
      message: error.message,
      endpoint: functionName,
      statusCode: error.status || 500,
      retryCount: 0,
      requestParams: {}
    };

    await logAPIError(apiError);
    await updateAPIHealthMetrics(functionName, false);
    
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