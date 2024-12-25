import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ExecutionContext {
  scheduleId: string;
  functionName: string;
  attempt: number;
  startTime: Date;
  executionWindow?: {
    start: Date;
    end: Date;
  };
}

export const createExecutionLog = async (context: ExecutionContext) => {
  console.log(`Creating execution log for schedule ${context.scheduleId}`);
  
  try {
    const { data: log, error } = await supabase
      .from('schedule_execution_logs')
      .insert({
        schedule_id: context.scheduleId,
        started_at: context.startTime.toISOString(),
        status: 'running',
        execution_context: {
          attempt: context.attempt,
          function_name: context.functionName,
          execution_window: context.executionWindow
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating execution log:', error);
      throw error;
    }

    return log;
  } catch (error) {
    console.error('Failed to create execution log:', error);
    toast({
      title: "Execution Logging Error",
      description: "Failed to create execution log. This may affect monitoring.",
      variant: "destructive",
    });
    throw error;
  }
};

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
        execution_metrics: details?.metrics
      })
      .eq('id', logId);

    if (error) {
      console.error('Error updating execution log:', error);
      throw error;
    }

    // Notify user of execution completion
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

export const getRecentExecutions = async (scheduleId?: string, limit: number = 10) => {
  console.log(`Fetching recent executions${scheduleId ? ` for schedule ${scheduleId}` : ''}`);
  
  try {
    const query = supabase
      .from('schedule_execution_logs')
      .select(`
        *,
        schedules (
          function_name
        )
      `)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (scheduleId) {
      query.eq('schedule_id', scheduleId);
    }

    const { data: executions, error } = await query;

    if (error) {
      console.error('Error fetching executions:', error);
      throw error;
    }

    return executions;
  } catch (error) {
    console.error('Failed to fetch recent executions:', error);
    toast({
      title: "Error",
      description: "Failed to load execution history.",
      variant: "destructive",
    });
    throw error;
  }
};