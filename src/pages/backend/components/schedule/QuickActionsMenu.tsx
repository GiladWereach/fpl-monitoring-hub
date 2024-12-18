import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Play, Pause, Copy, Download, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { ScheduleSettingsModal } from "./ScheduleSettingsModal";
import { ManualTriggerButton } from "@/components/schedule/ManualTriggerButton";

interface QuickActionsMenuProps {
  scheduleId: string;
  functionName: string;
  status: string;
  onStatusChange: () => void;
}

export function QuickActionsMenu({ 
  scheduleId, 
  functionName, 
  status, 
  onStatusChange 
}: QuickActionsMenuProps) {
  const [showSettings, setShowSettings] = useState(false);

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
          <ManualTriggerButton functionName={functionName} />
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