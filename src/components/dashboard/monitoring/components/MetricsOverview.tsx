import { Card } from "@/components/ui/card";
import { Activity, Server, Clock, AlertTriangle } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { MetricsData } from "../types/monitoring-types";

interface MetricsOverviewProps {
  metrics: MetricsData[];
}

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
  console.log('Rendering MetricsOverview with metrics:', metrics);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard
        title="Active Tasks"
        value={metrics?.reduce((sum, m) => sum + (m.total_successes || 0), 0)?.toString() || '0'}
        subtitle="Current executions"
        icon={Activity}
        iconColor="text-blue-500"
      />
      
      <MetricCard
        title="Request Rate"
        value={`${metrics?.reduce((sum, m) => sum + (m.total_successes || 0) + (m.total_errors || 0), 0) || 0}/min`}
        subtitle="Across all functions"
        icon={Clock}
        iconColor="text-amber-500"
      />
      
      <MetricCard
        title="System Health"
        value={(() => {
          const totalEndpoints = metrics?.length || 0;
          const healthyEndpoints = metrics?.filter(m => m.health_status === 'success').length || 0;
          return `${Math.round((healthyEndpoints / totalEndpoints) * 100)}%`;
        })()}
        subtitle="Overall system status"
        icon={Server}
        iconColor="text-green-500"
      />

      <MetricCard
        title="Error Rate"
        value={(() => {
          const totalErrors = metrics?.reduce((sum, m) => sum + (m.total_errors || 0), 0) || 0;
          const totalRequests = metrics?.reduce((sum, m) => 
            sum + (m.total_successes || 0) + (m.total_errors || 0), 0) || 1;
          return `${Math.round((totalErrors / totalRequests) * 100)}%`;
        })()}
        subtitle="System-wide error rate"
        icon={AlertTriangle}
        iconColor="text-red-500"
      />
    </div>
  );
}