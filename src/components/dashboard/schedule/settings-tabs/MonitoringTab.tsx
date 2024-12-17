import { Schedule } from "@/types/scheduling";
import { Card } from "@/components/ui/card";

interface MonitoringTabProps {
  schedule: Schedule;
}

export function MonitoringTab({ schedule }: MonitoringTabProps) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h4 className="text-sm font-medium mb-2">Performance Metrics</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Success Rate</p>
            <p className="text-lg font-semibold">{schedule.success_rate}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg. Duration</p>
            <p className="text-lg font-semibold">
              {schedule.avg_duration_ms ? `${(schedule.avg_duration_ms / 1000).toFixed(2)}s` : 'N/A'}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="text-sm font-medium mb-2">Last Execution</h4>
        <div className="space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Timestamp</p>
            <p className="font-medium">
              {schedule.last_execution_at ? new Date(schedule.last_execution_at).toLocaleString() : 'Never'}
            </p>
          </div>
          {schedule.last_failure_at && (
            <div>
              <p className="text-sm text-muted-foreground">Last Failure</p>
              <p className="font-medium text-red-500">
                {new Date(schedule.last_failure_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}