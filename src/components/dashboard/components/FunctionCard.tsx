import { Button } from "@/components/ui/button";
import { Play, RefreshCw } from "lucide-react";
import { ScheduleManager } from "../ScheduleManager";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

interface FunctionCardProps {
  name: string;
  functionName: string;
  loading: string | null;
  onExecute: (functionName: string) => Promise<void>;
  schedule?: any;
}

export function FunctionCard({ name, functionName, loading, onExecute, schedule }: FunctionCardProps) {
  const isLoading = loading === functionName || loading === "all";

  return (
    <Card className="p-4 bg-background">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-semibold truncate">{name}</h3>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onExecute(functionName)}
              disabled={loading !== null}
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
          {schedule ? (
            <>
              <div className="flex justify-between">
                <span>Schedule:</span>
                <span>
                  {schedule.frequency_type === 'fixed_interval' && 
                    `Every ${schedule.base_interval_minutes} minutes`}
                  {schedule.frequency_type === 'daily' && 
                    `Daily at ${schedule.fixed_time}`}
                  {schedule.frequency_type === 'match_dependent' &&
                    `Match day: ${schedule.match_day_interval_minutes}m, Other: ${schedule.non_match_interval_minutes}m`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Run:</span>
                <span>
                  {schedule.last_execution_at ? 
                    format(new Date(schedule.last_execution_at), "MMM d, HH:mm:ss") : 
                    'Never'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Next Run:</span>
                <span>
                  {schedule.next_execution_at ? 
                    format(new Date(schedule.next_execution_at), "MMM d, HH:mm:ss") : 
                    'Not scheduled'}
                </span>
              </div>
            </>
          ) : (
            <div className="italic">No schedule configured</div>
          )}
        </div>
      </div>
    </Card>
  );
}