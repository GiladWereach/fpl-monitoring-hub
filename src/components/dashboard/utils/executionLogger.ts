import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";
import { cleanupStaleExecutions } from "./execution/cleanupService";
import { startTimeoutMonitor } from "./execution/timeoutMonitor";
import { updateExecutionLog } from "./execution/statusUpdater";
import type { ExecutionContext } from "./execution/types";

export { updateExecutionLog } from "./execution/statusUpdater";

export const createExecutionLog = async (context: ExecutionContext) => {
  console.log(`Creating execution log for schedule ${context.scheduleId}`);
  
  try {
    await cleanupStaleExecutions();
    
    const { data: log, error } = await supabase
      .from('schedule_execution_logs')
      .insert({
        schedule_id: context.scheduleId,
        started_at: context.startTime.toISOString(),
        status: 'running',
        execution_context: {
          attempt: context.attempt,
          function_name: context.functionName,
          execution_window: context.executionWindow,
          instance_id: crypto.randomUUID()
        } as Json
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating execution log:', error);
      throw error;
    }

    startTimeoutMonitor(log.id, 30000); // 30 second timeout
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

export const logFunctionExecution = async (functionName: string, startedAt: string) => {
  console.log(`Logging execution for function: ${functionName}`);
  try {
    const { data: schedule } = await supabase
      .from('schedules')
      .select('id')
      .eq('function_name', functionName)
      .single();
      
    if (!schedule) {
      console.warn(`No schedule found for function ${functionName}`);
      return null;
    }

    return schedule.id;
  } catch (error) {
    console.error(`Error logging function execution for ${functionName}:`, error);
    return null;
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