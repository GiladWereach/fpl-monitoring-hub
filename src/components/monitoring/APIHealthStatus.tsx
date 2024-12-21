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

  // Calculate aggregated metrics
  const calculateMetrics = () => {
    if (!metrics?.length) {
      return {
        totalRequests: 0,
        successCount: 0,
        successRate: 100,
        avgResponseTime: 0,
        lastError: null,
        mostActiveEndpoint: 'N/A'
      };
    }

    const totalRequests = metrics.reduce((acc, m) => acc + (m.success_count || 0) + (m.error_count || 0), 0);
    const successCount = metrics.reduce((acc, m) => acc + (m.success_count || 0), 0);
    const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 100;
    
    // Calculate weighted average response time
    const totalSuccesses = metrics.reduce((acc, m) => acc + (m.success_count || 0), 0);
    const weightedResponseTime = metrics.reduce((acc, m) => 
      acc + ((m.avg_response_time || 0) * (m.success_count || 0)), 0);
    const avgResponseTime = totalSuccesses > 0 ? weightedResponseTime / totalSuccesses : 0;

    // Find the most recent error
    const lastError = metrics
      .filter(m => m.last_error_time)
      .sort((a, b) => new Date(b.last_error_time || 0).getTime() - new Date(a.last_error_time || 0).getTime())[0];

    // Find most active endpoint
    const endpointCounts = metrics.reduce((acc, m) => {
      const total = (m.success_count || 0) + (m.error_count || 0);
      acc[m.endpoint] = (acc[m.endpoint] || 0) + total;
      return acc;
    }, {} as Record<string, number>);

    const mostActiveEndpoint = Object.entries(endpointCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    return {
      totalRequests,
      successCount,
      successRate,
      avgResponseTime,
      lastError,
      mostActiveEndpoint
    };
  };

  const aggregatedMetrics = calculateMetrics();

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
        value={`${aggregatedMetrics.successRate.toFixed(1)}%`}
        status={aggregatedMetrics.successRate > 95 ? "success" : aggregatedMetrics.successRate > 90 ? "warning" : "error"}
        icon={<CheckCircle2 className="h-4 w-4" />}
        details={[
          { label: "Total Requests", value: aggregatedMetrics.totalRequests.toString() },
          { label: "Success Count", value: aggregatedMetrics.successCount.toString() }
        ]}
      />

      <StatusCard
        title="Avg Response Time"
        value={`${aggregatedMetrics.avgResponseTime.toFixed(2)}ms`}
        status={aggregatedMetrics.avgResponseTime < 500 ? "success" : aggregatedMetrics.avgResponseTime < 1000 ? "warning" : "error"}
        icon={<Clock className="h-4 w-4" />}
        details={[
          { label: "Most Active Endpoint", value: aggregatedMetrics.mostActiveEndpoint }
        ]}
      />

      <StatusCard
        title="Recent Errors"
        value={aggregatedMetrics.lastError ? 
          format(new Date(aggregatedMetrics.lastError.last_error_time!), "HH:mm:ss") : 
          "No errors"}
        status={!aggregatedMetrics.lastError ? "success" : "error"}
        icon={<AlertTriangle className="h-4 w-4" />}
        details={[
          { label: "Error Count", value: metrics?.reduce((acc, m) => acc + (m.error_count || 0), 0).toString() || "0" }
        ]}
      />

      <StatusCard
        title="Active Endpoints"
        value={Object.keys(metrics?.reduce((acc, m) => ({ ...acc, [m.endpoint]: true }), {}) || {}).length.toString()}
        status="info"
        icon={<Activity className="h-4 w-4" />}
        details={[
          { label: "Most Active", value: aggregatedMetrics.mostActiveEndpoint }
        ]}
      />
    </>
  );
}