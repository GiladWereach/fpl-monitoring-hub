import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface SchedulerHeaderProps {
  lastUpdated: Date;
  onRefresh: () => void;
}

export function SchedulerHeader({ lastUpdated, onRefresh }: SchedulerHeaderProps) {
  console.log("Rendering SchedulerHeader");
  
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold">Scheduler Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {format(lastUpdated, "HH:mm:ss dd/MM/yyyy")}
        </p>
      </div>
      <Button onClick={onRefresh} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </div>
  );
}