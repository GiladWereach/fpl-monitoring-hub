import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logAPIError, updateAPIHealthMetrics } from "@/utils/api/errorHandling";

export function LiveStatus() {
  const { data: status } = useQuery({
    queryKey: ["live-status"],
    queryFn: async () => {
      console.log("Fetching live status");
      const startTime = Date.now();
      
      try {
        const { data, error } = await supabase
          .from("api_health_metrics")
          .select("*")
          .order("last_success_time", { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;

        const endTime = Date.now();
        await updateAPIHealthMetrics("fetch_live_status", true, endTime - startTime);

        return data;
      } catch (error) {
        console.error("Error fetching live status:", error);
        await logAPIError({
          type: "SERVER_ERROR",
          message: error.message,
          endpoint: "fetch_live_status",
          statusCode: error.status || 500,
          retryCount: 0,
          requestParams: {}
        });
        await updateAPIHealthMetrics("fetch_live_status", false);
        throw error;
      }
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  return (
    <div className="p-4 rounded-lg bg-background border">
      <h3 className="text-lg font-semibold mb-2">Live Status</h3>
      <div className="space-y-2">
        <p>Last Success: {status?.last_success_time ? new Date(status.last_success_time).toLocaleString() : 'N/A'}</p>
        <p>Success Rate: {status ? ((status.success_count / (status.success_count + status.error_count)) * 100).toFixed(2) : 0}%</p>
        <p>Average Response Time: {status?.avg_response_time ? `${status.avg_response_time.toFixed(2)}ms` : 'N/A'}</p>
      </div>
    </div>
  );
}