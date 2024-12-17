import { MoreHorizontal, Play, Pause, Copy, Download, Settings, Trash, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { ScheduleSettingsModal } from "./ScheduleSettingsModal";

interface QuickActionsMenuProps {
  scheduleId: string;
  functionName: string;
  status: string;
  onStatusChange: () => void;
}

export function QuickActionsMenu({ scheduleId, functionName, status, onStatusChange }: QuickActionsMenuProps) {
  const [showSettings, setShowSettings] = useState(false);

  const handleManualTrigger = async () => {
    try {
      console.log(`Manually triggering function: ${functionName}`);
      
      // First, ensure we have a schedule record
      let targetScheduleId = scheduleId;
      
      if (!scheduleId) {
        console.log('No schedule exists, creating one...');
        const { data: newSchedule, error: scheduleError } = await supabase
          .from('schedules')
          .insert({
            function_name: functionName,
            schedule_type: 'event_based',
            enabled: true,
            event_config: {
              triggerType: 'manual',
              offsetMinutes: 0
            },
            execution_config: {
              retry_count: 3,
              timeout_seconds: 30,
              retry_delay_seconds: 60,
              concurrent_execution: false,
              retry_backoff: 'linear',
              max_retry_delay: 3600
            }
          })
          .select()
          .single();

        if (scheduleError) {
          console.error('Error creating schedule:', scheduleError);
          throw scheduleError;
        }
        
        targetScheduleId = newSchedule.id;
        console.log('Created new schedule with ID:', targetScheduleId);
      }

      // Create execution log entry
      const startTime = new Date().toISOString();
      const { data: log, error: logError } = await supabase
        .from('schedule_execution_logs')
        .insert({
          schedule_id: targetScheduleId,
          started_at: startTime,
          status: 'running'
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
      
      if (functionError) throw functionError;

      // Update execution log
      const { error: updateError } = await supabase
        .from('schedule_execution_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          execution_duration_ms: Date.now() - new Date(startTime).getTime()
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
        description: "Failed to trigger function",
        variant: "destructive",
      });
    }
  };

  const handleClone = async () => {
    try {
      const { data: schedule, error: fetchError } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', scheduleId)
        .single();

      if (fetchError) throw fetchError;

      const { error: createError } = await supabase
        .from('schedules')
        .insert({
          ...schedule,
          id: undefined,
          function_name: `${schedule.function_name}_copy`,
          enabled: false
        });

      if (createError) throw createError;

      toast({
        title: "Success",
        description: "Schedule cloned successfully",
      });
    } catch (error) {
      console.error('Error cloning schedule:', error);
      toast({
        title: "Error",
        description: "Failed to clone schedule",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      const { data: schedule, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', scheduleId)
        .single();

      if (error) throw error;

      const blob = new Blob([JSON.stringify(schedule, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedule-${schedule.function_name}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Schedule exported successfully",
      });
    } catch (error) {
      console.error('Error exporting schedule:', error);
      toast({
        title: "Error",
        description: "Failed to export schedule",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleManualTrigger}>
            <Zap className="mr-2 h-4 w-4" />
            <span>Trigger Now</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onStatusChange}>
            {status === 'active' ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                <span>Activate</span>
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleClone}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Clone</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            <span>Export</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowSettings(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ScheduleSettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        scheduleId={scheduleId}
      />
    </>
  );
}