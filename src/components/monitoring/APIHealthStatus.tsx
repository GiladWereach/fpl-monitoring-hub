import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { Activity, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";

export function APIHealthStatus() {
  const { data: metrics } = useQuery({
    queryKey: ["api-health-metrics"],
    queryFn: async () => {
      console.log("Fetching API health metrics");
      const { data, error } = await supabase
        .from("api_health_metrics")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching API metrics:", error);
        throw error;
      }

      console.log("Fetched metrics:", data);
      return data;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Calculate totals across all endpoints
  const totalRequests = metrics?.reduce(
    (acc, metric) => acc + (metric.success_count || 0) + (metric.error_count || 0),
    0
  ) || 0;

  const successCount = metrics?.reduce(
    (acc, metric) => acc + (metric.success_count || 0),
    0
  ) || 0;

  const successRate = totalRequests > 0 
    ? (successCount / totalRequests) * 100 
    : 0;

  const avgResponseTime = metrics?.reduce(
    (acc, metric) => acc + (metric.avg_response_time || 0),
    0
  ) / (metrics?.length || 1);

  // Find the most recent error
  const lastError = metrics?.reduce((latest, metric) => {
    if (!latest || (metric.last_error_time && new Date(metric.last_error_time) > new Date(latest))) {
      return metric.last_error_time;
    }
    return latest;
  }, null as string | null);

  // Find the most active endpoint
  const mostActiveEndpoint = metrics?.reduce((most, current) => {
    const currentTotal = (current.success_count || 0) + (current.error_count || 0);
    const mostTotal = (most?.success_count || 0) + (most?.error_count || 0);
    return currentTotal > mostTotal ? current : most;
  }, null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatusCard
        title="API Success Rate"
        value={`${successRate.toFixed(1)}%`}
        status={successRate > 95 ? "success" : successRate > 90 ? "warning" : "error"}
        icon={<CheckCircle2 className="h-4 w-4" />}
        details={[
          { label: "Total Requests", value: totalRequests },
          { label: "Success Count", value: successCount }
        ]}
      />

      <StatusCard
        title="Avg Response Time"
        value={`${avgResponseTime.toFixed(2)}ms`}
        status={avgResponseTime < 500 ? "success" : avgResponseTime < 1000 ? "warning" : "error"}
        icon={<Clock className="h-4 w-4" />}
        details={[
          { label: "Slowest Endpoint", value: metrics?.sort((a, b) => (b.avg_response_time || 0) - (a.avg_response_time || 0))[0]?.endpoint || 'N/A' }
        ]}
      />

      <StatusCard
        title="Recent Errors"
        value={lastError ? format(new Date(lastError), "HH:mm:ss") : "No errors"}
        status={!lastError ? "success" : "error"}
        icon={<AlertTriangle className="h-4 w-4" />}
        details={[
          { label: "Error Count", value: metrics?.reduce((acc, m) => acc + (m.error_count || 0), 0) || 0 }
        ]}
      />

      <StatusCard
        title="Active Endpoints"
        value={metrics?.length || 0}
        status="info"
        icon={<Activity className="h-4 w-4" />}
        details={[
          { label: "Most Active", value: mostActiveEndpoint?.endpoint || 'N/A' }
        ]}
      />
    </div>
  );
}