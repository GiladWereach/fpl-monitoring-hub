import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

export const updateExecutionLog = async (
  logId: string, 
  status: 'completed' | 'failed' | 'cancelled',
  details?: {
    error?: string;
    duration?: number;
    metrics?: Record<string, any>;
  }
) => {
  console.log(`Updating execution log ${logId} with status: ${status}`);
  
  try {
    const { error } = await supabase
      .from('schedule_execution_logs')
      .update({
        status,
        completed_at: new Date().toISOString(),
        error_details: details?.error,
        execution_duration_ms: details?.duration,
        execution_metrics: details?.metrics as Json
      })
      .eq('id', logId);

    if (error) {
      console.error('Error updating execution log:', error);
      throw error;
    }

    toast({
      title: `Execution ${status === 'completed' ? 'Successful' : 'Failed'}`,
      description: status === 'completed' 
        ? `Completed in ${details?.duration}ms`
        : `Failed: ${details?.error}`,
      variant: status === 'completed' ? "default" : "destructive",
    });
  } catch (error) {
    console.error('Failed to update execution log:', error);
    toast({
      title: "Execution Logging Error",
      description: "Failed to update execution log status.",
      variant: "destructive",
    });
    throw error;
  }
};