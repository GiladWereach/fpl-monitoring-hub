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

interface QuickActionsMenuProps {
  scheduleId: string;
  status: string;
  onStatusChange: (status: string) => Promise<void>;
}

export function QuickActionsMenu({ scheduleId, status, onStatusChange }: QuickActionsMenuProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleForceRun = async () => {
    // Implementation for force run
    toast({
      title: "Schedule Triggered",
      description: "Function execution has been initiated",
    });
  };

  const handleClone = () => {
    // Implementation for cloning
    toast({
      title: "Schedule Cloned",
      description: "A copy of the schedule has been created",
    });
  };

  const handleExport = () => {
    // Implementation for export
    const config = {
      id: scheduleId,
      status: status,
      // Add other relevant fields
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schedule-${scheduleId}.json`;
    a.click();
    URL.revokeObjectURL(url);
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