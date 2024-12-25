import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const cleanupStaleExecutions = async () => {
  console.log('Cleaning up stale executions');
  
  const { error } = await supabase
    .from('schedule_execution_logs')
    .update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_details: 'Execution terminated due to timeout'
    })
    .eq('status', 'running')
    .lt('started_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // 5 minutes

  if (error) {
    console.error('Error cleaning up stale executions:', error);
    toast({
      title: "Cleanup Error",
      description: "Failed to clean up stale executions",
      variant: "destructive",
    });
  }
};