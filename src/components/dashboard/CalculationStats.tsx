import { Calculator, Clock, Activity, Zap } from "lucide-react";
import { StatusCard } from "./StatusCard";

interface CalculationStatsProps {
  activeCalculations: number;
  completedToday: number;
  failedToday: number;
  avgExecutionTime: number;
}

function formatExecutionTime(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else if (ms < 3600000) {
    return `${(ms / 60000).toFixed(2)}m`;
  } else {
    return `${(ms / 3600000).toFixed(2)}h`;
  }
}

export function CalculationStats({
  activeCalculations,
  completedToday,
  failedToday,
  avgExecutionTime,
}: CalculationStatsProps) {
  // Ensure avgExecutionTime is a reasonable value (prevent extreme numbers)
  const normalizedExecutionTime = avgExecutionTime > 0 && avgExecutionTime < 86400000 
    ? avgExecutionTime  // If less than 24 hours, use actual value
    : 0;  // Reset to 0 if unreasonable

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatusCard
        title="Active Calculations"
        value={activeCalculations}
        status={activeCalculations > 0 ? "info" : "success"}
        icon={<Calculator className="h-4 w-4" />}
        trend={{
          value: 5,
          label: "vs last hour"
        }}
        details={[
          { label: "Queue Size", value: "2" },
          { label: "Avg. Wait Time", value: "45s" }
        ]}
      />
      <StatusCard
        title="Completed Today"
        value={completedToday}
        status="success"
        icon={<Clock className="h-4 w-4" />}
        trend={{
          value: 12,
          label: "vs yesterday"
        }}
        details={[
          { label: "Success Rate", value: "98%" },
          { label: "Avg. Duration", value: "2m 30s" }
        ]}
      />
      <StatusCard
        title="Failed Today"
        value={failedToday}
        status={failedToday > 0 ? "error" : "success"}
        icon={<Activity className="h-4 w-4" />}
        trend={{
          value: -2,
          label: "vs yesterday"
        }}
        details={[
          { label: "Error Rate", value: `${((failedToday / (failedToday + completedToday)) * 100).toFixed(1)}%` },
          { label: "Most Common Error", value: "Timeout" }
        ]}
      />
      <StatusCard
        title="Avg. Execution Time"
        value={formatExecutionTime(normalizedExecutionTime)}
        status={normalizedExecutionTime > 5000 ? "warning" : "success"}
        icon={<Zap className="h-4 w-4" />}
        trend={{
          value: -8,
          label: "vs last hour"
        }}
        details={[
          { label: "Peak Time", value: "2.8s" },
          { label: "Idle Time", value: "0.2s" }
        ]}
      />
    </div>
  );
}