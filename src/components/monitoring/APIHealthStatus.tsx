import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { Activity, AlertTriangle, CheckCircle2, Clock, Database, Server, Calculator } from "lucide-react";
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
    refetchInterval: 30000
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
    : 100;

  const avgResponseTime = metrics?.reduce(
    (acc, metric) => acc + (metric.avg_response_time || 0),
    0
  ) / (metrics?.length || 1);

  const lastError = metrics?.reduce((latest, metric) => {
    if (!latest || (metric.last_error_time && new Date(metric.last_error_time) > new Date(latest))) {
      return metric.last_error_time;
    }
    return latest;
  }, null as string | null);

  const mostActiveEndpoint = metrics?.reduce((most, current) => {
    const currentTotal = (current.success_count || 0) + (current.error_count || 0);
    const mostTotal = (most?.success_count || 0) + (most?.error_count || 0);
    return currentTotal > mostTotal ? current : most;
  }, null);

  return (
    <>
      {/* System Overview Cards */}
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
        value="8 Active"
        status="success"
        icon={<Server className="h-4 w-4" />}
        details={[
          { label: "Total Functions", value: "10" },
          { label: "Health Score", value: "100%" }
        ]}
      />

      <StatusCard
        title="Calculations"
        value="0 Running"
        status="info"
        icon={<Calculator className="h-4 w-4" />}
        details={[
          { label: "Completed Today", value: "24" },
          { label: "Average Duration", value: "2.3s" }
        ]}
      />

      <StatusCard
        title="System Errors"
        value="0"
        status="success"
        icon={<AlertTriangle className="h-4 w-4" />}
        details={[
          { label: "Last 24h", value: "0" },
          { label: "Critical", value: "0" }
        ]}
      />

      {/* API Health Metrics */}
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
    </>
  );
}