import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { getExecutionMetrics } from "@/services/executionMonitoringService";
import { CheckCircle2, XCircle, Clock, Activity } from "lucide-react";
import { MetricCard } from "./components/MetricCard";

interface ExecutionMetricsDisplayProps {
  functionName: string;
}

export function ExecutionMetricsDisplay({ functionName }: ExecutionMetricsDisplayProps) {
  console.log(`Rendering ExecutionMetricsDisplay for ${functionName}`);

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['execution-metrics', functionName],
    queryFn: () => getExecutionMetrics(functionName),
    refetchInterval: 60000 // Refresh every minute
  });

  if (isLoading || !metrics) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const successRate = metrics.totalExecutions ? 
    (metrics.successfulExecutions / metrics.totalExecutions) * 100 : 
    0;

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Execution Metrics (Last 24h)</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Success Rate"
          value={`${successRate.toFixed(1)}%`}
          icon={CheckCircle2}
          iconColor="text-success"
          subtitle={`${metrics.successfulExecutions}/${metrics.totalExecutions} executions`}
        />
        
        <MetricCard
          title="Average Interval"
          value={`${metrics.averageInterval.toFixed(1)}m`}
          icon={Clock}
          iconColor="text-blue-500"
          subtitle="Between executions"
        />
        
        <MetricCard
          title="Match Day Accuracy"
          value={`${metrics.matchDayAccuracy.toFixed(1)}%`}
          icon={Activity}
          iconColor="text-purple-500"
          subtitle="2-minute interval adherence"
        />
        
        <MetricCard
          title="Failed Executions"
          value={metrics.failedExecutions.toString()}
          icon={XCircle}
          iconColor="text-destructive"
          subtitle="Total failures"
        />
      </div>

      {metrics.lastExecution && (
        <p className="text-sm text-muted-foreground">
          Last execution: {metrics.lastExecution.toLocaleString()}
        </p>
      )}
    </Card>
  );
}