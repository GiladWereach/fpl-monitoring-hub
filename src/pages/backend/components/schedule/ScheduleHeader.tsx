import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ScheduleHeaderProps {
  onNewFunction: () => void;
}

export function ScheduleHeader({ onNewFunction }: ScheduleHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Schedule Manager</h1>
        <p className="text-muted-foreground mt-1">
          Manage and monitor function schedules
        </p>
      </div>
      <Button onClick={onNewFunction}>
        <Plus className="mr-2 h-4 w-4" />
        New Function
      </Button>
    </div>
  );
}