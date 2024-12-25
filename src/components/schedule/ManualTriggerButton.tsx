import { Zap } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ManualTriggerButtonProps {
  functionName: string;
}

export const ManualTriggerButton = ({ functionName }: ManualTriggerButtonProps) => {
  const handleManualTrigger = async () => {
    console.log(`Starting manual trigger for function: ${functionName}`);
    
    try {
      // Step 1: Get schedule ID for the function
      const { data: schedule, error: scheduleError } = await supabase
        .from('schedules')
        .select('id')
        .eq('function_name', functionName)
        .single();
        
      if (scheduleError) {
        console.error(`Error fetching schedule for ${functionName}:`, scheduleError);
        throw new Error(`Could not find schedule for function: ${functionName}`);
      }

      console.log(`Found schedule with ID ${schedule.id} for function ${functionName}`);

      // Step 2: Create execution log with valid schedule ID
      const { data: log, error: logError } = await supabase
        .from('schedule_execution_logs')
        .insert({
          schedule_id: schedule.id,
          status: 'running',
          started_at: new Date().toISOString(),
          execution_context: {
            trigger_type: 'manual',
            triggered_by: 'user',
            schedule_id: schedule.id
          }
        })
        .select()
        .single();
        
      if (logError) {
        console.error('Error creating execution log:', logError);
        throw logError;
      }

      console.log(`Created execution log with ID ${log.id}`);
      
      // Step 3: Execute the function with context
      const { error: functionError } = await supabase.functions.invoke(functionName, {
        body: {
          execution_context: {
            schedule_id: schedule.id,
            execution_id: log.id,
            trigger_type: 'manual'
          }
        }
      });
      
      if (functionError) {
        console.error(`Error executing function ${functionName}:`, functionError);
        
        // Update log with error status
        await supabase
          .from('schedule_execution_logs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_details: functionError.message,
            execution_context: {
              trigger_type: 'manual',
              triggered_by: 'user',
              schedule_id: schedule.id,
              error: functionError.message
            }
          })
          .eq('id', log.id);
          
        throw functionError;
      }

      console.log(`Successfully executed function ${functionName}`);
      
      // Step 4: Update execution log with success status
      const { error: updateError } = await supabase
        .from('schedule_execution_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          execution_context: {
            trigger_type: 'manual',
            triggered_by: 'user',
            schedule_id: schedule.id,
            completed: true
          }
        })
        .eq('id', log.id);

      if (updateError) {
        console.error('Error updating execution log:', updateError);
        throw updateError;
      }

      console.log(`Updated execution log ${log.id} with completed status`);

      toast({
        title: "Success",
        description: `${functionName} triggered successfully`,
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