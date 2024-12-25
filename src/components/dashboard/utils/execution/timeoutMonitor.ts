import { supabase } from "@/integrations/supabase/client";
import { updateExecutionLog } from "./statusUpdater";

export const startTimeoutMonitor = async (logId: string, timeoutMs: number) => {
  console.log(`Starting timeout monitor for execution ${logId}`);
  
  setTimeout(async () => {
    const { data: log } = await supabase
      .from('schedule_execution_logs')
      .select('status')
      .eq('id', logId)
      .single();

    if (log?.status === 'running') {
      console.log(`Execution ${logId} timed out after ${timeoutMs}ms`);
      await updateExecutionLog(logId, 'failed', {
        error: 'Execution timed out',
        duration: timeoutMs
      });
    }
  }, timeoutMs);
};