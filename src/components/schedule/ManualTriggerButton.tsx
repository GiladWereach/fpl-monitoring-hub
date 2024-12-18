import { Zap } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ensureScheduleExists, createExecutionLog, updateExecutionLog } from "@/utils/scheduleUtils";

interface ManualTriggerButtonProps {
  functionName: string;
}

export const ManualTriggerButton = ({ functionName }: ManualTriggerButtonProps) => {
  const handleManualTrigger = async () => {
    try {
      console.log(`Manually triggering function: ${functionName}`);
      
      // Ensure we have a schedule and create execution log
      const scheduleId = await ensureScheduleExists(functionName);
      const log = await createExecutionLog(scheduleId);
      
      // Execute the function
      const { error: functionError } = await supabase.functions.invoke(functionName);
      
      if (functionError) throw functionError;
      
      // Update execution log with success
      await updateExecutionLog(log.id, true);

      toast({
        title: "Success",
        description: "Function triggered successfully",
      });
    } catch (error) {
      console.error('Error in manual trigger:', error);
      toast({
        title: "Error",
        description: "Failed to trigger function",
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