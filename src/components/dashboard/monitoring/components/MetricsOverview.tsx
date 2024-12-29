import { Card } from "@/components/ui/card";
import { Activity, Server, Clock, AlertTriangle } from "lucide-react";
import { MetricCard } from "./MetricCard";

interface MetricsOverviewProps {
  metrics: any[];
}

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard
        title="Active Tasks"
        value={metrics?.reduce((sum, m) => sum + m.activeTasks, 0)?.toString() || '0'}
        subtitle="Current executions"
        icon={Activity}
        iconColor="text-blue-500"
      />
      
      <MetricCard
        title="Request Rate"
        value={`${metrics?.reduce((sum, m) => sum + m.requestRate, 0) || 0}/min`}
        subtitle="Across all functions"
        icon={Clock}
        iconColor="text-amber-500"
      />
      
      <MetricCard
        title="Pool Utilization"
        value={(() => {
          const pools = metrics?.filter(m => m.poolStatus).map(m => m.poolStatus!);
          if (!pools?.length) return '0%';
          const used = pools.reduce((sum, p) => sum + (p.total - p.available), 0);
          const total = pools.reduce((sum, p) => sum + p.total, 0);
          return `${Math.round((used / total) * 100)}%`;
        })()}
        subtitle="Resource pool usage"
        icon={Server}
        iconColor="text-green-500"
      />

      <MetricCard
        title="Prediction Confidence"
        value={(() => {
          if (!metrics?.length) return 'N/A';
          const avgConfidence = metrics.reduce((sum, m) => sum + m.predictedUsage.confidence, 0) / metrics.length;
          return `${Math.round(avgConfidence * 100)}%`;
        })()}
        subtitle="Resource prediction accuracy"
        icon={AlertTriangle}
        iconColor="text-purple-500"
      />
    </div>
  );
}