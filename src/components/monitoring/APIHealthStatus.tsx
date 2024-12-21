import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { Activity, AlertTriangle, CheckCircle2, Clock, Database, Server, Calculator } from "lucide-react";
import { format } from "date-fns";

type HealthStatus = "success" | "warning" | "error" | "info";

export function APIHealthStatus() {
  const { data: metrics } = useQuery({
    queryKey: ["api-health-metrics"],
    queryFn: async () => {
      console.log("Fetching API health metrics");
      const { data, error } = await supabase
        .rpc('get_aggregated_metrics', { hours_lookback: 24 });

      if (error) {
        console.error("Error fetching API metrics:", error);
        throw error;
      }

      console.log("Fetched metrics:", data);
      return data;
    },
    refetchInterval: 30000 // 30 seconds in milliseconds
  });

  // Helper function to format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
  };

  // Calculate overall system health
  const overallHealth: HealthStatus = metrics?.reduce((acc: HealthStatus, curr) => {
    if (curr.health_status === 'error') return 'error';
    if (curr.health_status === 'warning' && acc !== 'error') return 'warning';
    return acc;
  }, 'success' as HealthStatus);

  const avgResponseTime = metrics?.reduce((acc, curr) => acc + curr.avg_response_time, 0) / (metrics?.length || 1);

  return (
    <>
      <StatusCard
        title="Database Status"
        value="Connected"
        status="success"
        icon={<Database className="h-4 w-4" />}
        details={[
          { label: "Active Connections", value: "5" },
          { label: "Query Performance", value: "Optimal" }
        ]}
      />
      
      <StatusCard
        title="Edge Functions"
        value={`${metrics?.length || 0} Active`}
        status="success"
        icon={<Server className="h-4 w-4" />}
        details={[
          { label: "Avg Response Time", value: formatDuration(avgResponseTime || 0) },
          { label: "Health Score", value: `${Math.round((metrics?.filter(m => m.health_status === 'success').length || 0) / (metrics?.length || 1) * 100)}%` }
        ]}
      />

      <StatusCard
        title="System Health"
        value={overallHealth === 'success' ? 'Healthy' : overallHealth === 'warning' ? 'Warning' : 'Issues Detected'}
        status={overallHealth || 'info'}
        icon={<Activity className="h-4 w-4" />}
        details={[
          { label: "Total Endpoints", value: metrics?.length.toString() || "0" },
          { label: "Healthy Endpoints", value: metrics?.filter(m => m.health_status === 'success').length.toString() || "0" }
        ]}
      />

      <StatusCard
        title="System Errors"
        value={metrics?.filter(m => m.health_status === 'error').length.toString() || "0"}
        status={metrics?.some(m => m.health_status === 'error') ? 'error' : 'success'}
        icon={<AlertTriangle className="h-4 w-4" />}
        details={[
          { label: "Last 24h", value: metrics?.reduce((acc, curr) => acc + curr.total_errors, 0).toString() || "0" },
          { label: "Critical", value: metrics?.filter(m => m.health_status === 'error').length.toString() || "0" }
        ]}
      />
    </>
  );
}