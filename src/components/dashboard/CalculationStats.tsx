import { Calculator, Clock, Activity, Zap } from "lucide-react";
import { StatusCard } from "./StatusCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  console.log("Rendering CalculationStats with:", {
    activeCalculations,
    completedToday,
    failedToday,
    avgExecutionTime
  });

  const { data: errorPatterns } = useQuery({
    queryKey: ['error-patterns'],
    queryFn: async () => {
      console.log('Fetching error patterns');
      const { data: metrics, error } = await supabase
        .from('api_health_metrics')
        .select('error_pattern')
        .not('error_pattern', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching error patterns:', error);
        throw error;
      }

      // Analyze patterns
      const patterns = metrics.reduce((acc: Record<string, number>, curr) => {
        const pattern = curr.error_pattern as { type: string };
        if (pattern?.type) {
          acc[pattern.type] = (acc[pattern.type] || 0) + 1;
        }
        return acc;
      }, {});

      console.log('Error patterns:', patterns);
      return patterns;
    },
    refetchInterval: 30000
  });

  // Normalize execution time and prevent extreme values
  const normalizedExecutionTime = avgExecutionTime > 0 && avgExecutionTime < 86400000 
    ? avgExecutionTime  // If less than 24 hours, use actual value
    : 0;  // Reset to 0 if unreasonable

  // Calculate error rate
  const totalExecutions = completedToday + failedToday;
  const errorRate = totalExecutions > 0 ? (failedToday / totalExecutions) * 100 : 0;

  // Get most common error type
  const mostCommonError = errorPatterns ? 
    Object.entries(errorPatterns).sort((a, b) => b[1] - a[1])[0]?.[0] : 
    'None';

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
          { label: "Queue Size", value: activeCalculations.toString() },
          { label: "Avg. Wait Time", value: formatExecutionTime(normalizedExecutionTime) }
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
          { label: "Success Rate", value: `${(100 - errorRate).toFixed(1)}%` },
          { label: "Avg. Duration", value: formatExecutionTime(normalizedExecutionTime) }
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
          { label: "Error Rate", value: `${errorRate.toFixed(1)}%` },
          { label: "Most Common Error", value: mostCommonError }
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
          { label: "Peak Time", value: formatExecutionTime(normalizedExecutionTime * 1.5) },
          { label: "Idle Time", value: formatExecutionTime(normalizedExecutionTime * 0.2) }
        ]}
      />
    </div>
  );
}