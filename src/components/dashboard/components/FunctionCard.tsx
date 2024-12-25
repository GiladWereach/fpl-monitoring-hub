import { Button } from "@/components/ui/button";
import { Play, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { ScheduleManager } from "../ScheduleManager";
import { useFunctionData } from "../hooks/useFunctionData";
import { FunctionCardMetrics } from "./FunctionCardMetrics";
import { FunctionCardSchedule } from "./FunctionCardSchedule";

interface FunctionCardProps {
  name: string;
  functionName: string;
  loading: string | null;
  onExecute: (functionName: string) => Promise<void>;
  schedule?: any;
}

export function FunctionCard({ name, functionName, loading, onExecute, schedule }: FunctionCardProps) {
  const isLoading = loading === functionName || loading === "all";
  const { data: functionData, isLoading: dataLoading } = useFunctionData(functionName, schedule);

  const handleManualTrigger = async () => {
    console.log(`Manually triggering ${functionName}`);
    try {
      await onExecute(functionName);
      toast({
        title: "Function Triggered",
        description: `${name} has been manually triggered`,
      });
    } catch (error) {
      console.error(`Error triggering ${functionName}:`, error);
      toast({
        title: "Error",
        description: `Failed to trigger ${name}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-4 bg-background">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold truncate">{name}</h3>
            <FunctionCardMetrics metrics={functionData?.metrics} />
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualTrigger}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <ScheduleManager
              functionName={functionName}
              functionDisplayName={name}
            />
          </div>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          {dataLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <FunctionCardSchedule 
              schedule={schedule}
              functionData={functionData}
            />
          )}
        </div>
      </div>
    </Card>
  );
}