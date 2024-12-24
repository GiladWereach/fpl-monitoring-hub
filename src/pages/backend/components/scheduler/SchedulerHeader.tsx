import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface SchedulerHeaderProps {
  lastUpdated: Date;
  onRefresh: () => void;
}

export function SchedulerHeader({ lastUpdated, onRefresh }: SchedulerHeaderProps) {
  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center mb-8">
      <div>
        <h1 className="text-2xl font-bold">Schedule Manager</h1>
        <p className="text-muted-foreground mt-1">
          Manage and monitor function schedules
        </p>
      </div>
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="gap-2 whitespace-nowrap"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  );
}