import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { getScheduleMonitoringMetrics } from "@/services/scheduleMonitoringService";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

interface ScheduleMonitoringProps {
  scheduleId: string;
}

export function ScheduleMonitoring({ scheduleId }: ScheduleMonitoringProps) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['schedule-metrics', scheduleId],
    queryFn: () => getScheduleMonitoringMetrics(scheduleId),
    refetchInterval: 60000 // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-2">Loading metrics...</span>
        </div>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  const successRate = (metrics.successfulExecutions / metrics.totalExecutions) * 100;
  const isHealthy = successRate >= 95 && 
                   metrics.matchDayIntervalAccuracy >= 90 && 
                   metrics.nonMatchIntervalAccuracy >= 90;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Schedule Health</h3>
        {isHealthy ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <XCircle className="h-5 w-5 text-destructive" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Success Rate</p>
          <p className="text-lg font-medium">{successRate.toFixed(1)}%</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Avg. Execution Time</p>
          <p className="text-lg font-medium">
            {metrics.averageExecutionTime.toFixed(0)}ms
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Match Day Accuracy</p>
          <p className="text-lg font-medium">
            {metrics.matchDayIntervalAccuracy.toFixed(1)}%
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Non-Match Accuracy</p>
          <p className="text-lg font-medium">
            {metrics.nonMatchIntervalAccuracy.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="pt-2 border-t">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {metrics.totalExecutions} executions in the last 24h
            ({metrics.failedExecutions} failed)
          </span>
        </div>
      </div>
    </Card>
  );
}