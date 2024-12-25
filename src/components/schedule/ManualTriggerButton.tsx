import { Zap } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ManualTriggerButtonProps {
  functionName: string;
}

export const ManualTriggerButton = ({ functionName }: ManualTriggerButtonProps) => {
  const handleManualTrigger = async () => {
    try {
      console.log(`Manually triggering function: ${functionName}`);
      
      // First get the schedule ID
      const { data: schedule, error: scheduleError } = await supabase
        .from('schedules')
        .select('id')
        .eq('function_name', functionName)
        .single();
        
      if (scheduleError) {
        console.error('Error fetching schedule:', scheduleError);
        throw new Error(`Could not find schedule for function: ${functionName}`);
      }

      // Create execution log with valid schedule ID
      const { data: log, error: logError } = await supabase
        .from('schedule_execution_logs')
        .insert({
          schedule_id: schedule.id,
          status: 'running',
          started_at: new Date().toISOString(),
          execution_context: {
            trigger_type: 'manual',
            triggered_by: 'user'
          }
        })
        .select()
        .single();
        
      if (logError) {
        console.error('Error creating execution log:', logError);
        throw logError;
      }

      console.log('Created execution log:', log);
      
      // Execute the function
      const { error: functionError } = await supabase.functions.invoke(functionName);
      
      if (functionError) {
        console.error('Error executing function:', functionError);
        
        // Update log with error
        await supabase
          .from('schedule_execution_logs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_details: functionError.message
          })
          .eq('id', log.id);
          
        throw functionError;
      }
      
      // Update execution log with success
      const { error: updateError } = await supabase
        .from('schedule_execution_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', log.id);

      if (updateError) {
        console.error('Error updating execution log:', updateError);
        throw updateError;
      }

      toast({
        title: "Success",
        description: "Function triggered successfully",
      });
    } catch (error) {
      console.error('Error in manual trigger:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to trigger function",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenuItem onClick={handleManualTrigger}>
      <Zap className="mr-2 h-4 w-4" />
      <span>Trigger Now</span>
    </DropdownMenuItem>
  );
};