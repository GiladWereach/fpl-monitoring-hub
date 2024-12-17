import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Play, Pause, FileText, Settings, Copy, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { ScheduleSettingsModal } from "./ScheduleSettingsModal";
import { supabase } from "@/integrations/supabase/client";

interface QuickActionsMenuProps {
  scheduleId: string;
  status: string;
  onStatusChange: (status: string) => Promise<void>;
}

export function QuickActionsMenu({ scheduleId, status, onStatusChange }: QuickActionsMenuProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleForceRun = async () => {
    try {
      const { error } = await supabase.functions.invoke('process-schedules', {
        body: { scheduleId, force: true }
      });

      if (error) throw error;

      toast({
        title: "Schedule Triggered",
        description: "Function execution has been initiated",
      });
    } catch (error) {
      console.error('Error forcing schedule execution:', error);
      toast({
        title: "Error",
        description: "Failed to trigger function execution",
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
          enabled: false,
        });

      if (createError) throw createError;

      toast({
        title: "Schedule Cloned",
        description: "A copy of the schedule has been created",
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

      const blob = new Blob([JSON.stringify(schedule, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `schedule-${schedule.function_name}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting schedule:', error);
      toast({
        title: "Error",
        description: "Failed to export schedule configuration",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onStatusChange(status === "active" ? "paused" : "active")}>
            {status === "active" ? (
              <Pause className="mr-2 h-4 w-4" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {status === "active" ? "Pause" : "Resume"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleForceRun}>
            <Play className="mr-2 h-4 w-4" />
            Force Run
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.open(`/backend/logs?schedule=${scheduleId}`, "_blank")}>
            <FileText className="mr-2 h-4 w-4" />
            View Logs
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleClone}>
            <Copy className="mr-2 h-4 w-4" />
            Clone
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Config
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ScheduleSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        scheduleId={scheduleId}
      />
    </>
  );
}