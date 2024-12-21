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
      {metrics?.map((metric) => (
        <StatusCard
          key={`${metric.endpoint}-success`}
          title={`${metric.endpoint} Success Rate`}
          value={`${metric.success_rate}%`}
          status={metric.health_status === 'success' ? "success" : 
                 metric.health_status === 'warning' ? "warning" : "error"}
          icon={<CheckCircle2 className="h-4 w-4" />}
          details={[
            { label: "Total Requests", value: (metric.total_successes + metric.total_errors).toString() },
            { label: "Success Count", value: metric.total_successes.toString() }
          ]}
        />
      ))}

      {metrics?.map((metric) => (
        <StatusCard
          key={`${metric.endpoint}-time`}
          title={`${metric.endpoint} Response Time`}
          value={`${metric.avg_response_time}ms`}
          status={metric.avg_response_time < 500 ? "success" : 
                 metric.avg_response_time < 1000 ? "warning" : "error"}
          icon={<Clock className="h-4 w-4" />}
          details={[
            { label: "Latest Success", value: metric.latest_success ? 
              format(new Date(metric.latest_success), "HH:mm:ss") : 'Never' }
          ]}
        />
      ))}

      {metrics?.map((metric) => (
        <StatusCard
          key={`${metric.endpoint}-errors`}
          title={`${metric.endpoint} Recent Errors`}
          value={metric.latest_error ? 
            format(new Date(metric.latest_error), "HH:mm:ss") : 
            "No errors"}
          status={!metric.latest_error ? "success" : "error"}
          icon={<AlertTriangle className="h-4 w-4" />}
          details={[
            { label: "Error Count", value: metric.total_errors.toString() }
          ]}
        />
      ))}

      <StatusCard
        title="Active Endpoints"
        value={metrics?.length.toString() || "0"}
        status="info"
        icon={<Activity className="h-4 w-4" />}
        details={[
          { label: "Total Endpoints", value: metrics?.length.toString() || "0" }
        ]}
      />
    </>
  );
}