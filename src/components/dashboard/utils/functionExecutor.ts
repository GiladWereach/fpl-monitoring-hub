import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { logFunctionExecution, updateExecutionLog } from "./executionLogger";

export const executeFetchFunction = async (functionName: string) => {
  const started_at = new Date().toISOString();
  let scheduleId: string | undefined;

  try {
    console.log(`Executing function: ${functionName}`);
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

    return { success: true };
  } catch (error) {
    console.error(`Error executing ${functionName}:`, error);
    
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