import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { APIHealthStatus } from "@/components/monitoring/APIHealthStatus";
import { SystemHealthOverview } from "@/components/dashboard/monitoring/components/SystemHealthOverview";
import { PerformanceMetrics } from "@/components/dashboard/monitoring/components/PerformanceMetrics";
import { ErrorAnalyticsDashboard } from "@/components/dashboard/monitoring/ErrorAnalyticsDashboard";

interface SystemMetrics {
  success_rate: number;
  avg_response_time: number;
  error_rate: number;
  system_load: number;
}

export function MonitoringDashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      console.log('Fetching system metrics');
      const { data: healthData, error } = await supabase.rpc('get_aggregated_metrics');
      
      if (error) {
        console.error('Error fetching metrics:', error);
        throw error;
      }
      
      // Transform the data to match the expected interface
      const transformedData: SystemMetrics = {
        success_rate: healthData[0]?.success_rate || 0,
        avg_response_time: healthData[0]?.avg_response_time || 0,
        error_rate: 100 - (healthData[0]?.success_rate || 0),
        system_load: healthData[0]?.total_successes || 0
      };
      
      console.log('Fetched metrics:', transformedData);
      return transformedData;
    },
    refetchInterval: 30000
  });

  if (isLoading) {
    return <div>Loading metrics...</div>;
  }

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">System Monitoring</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <APIHealthStatus />
        <SystemHealthOverview metrics={metrics || {
          success_rate: 0,
          avg_response_time: 0,
          error_rate: 0,
          system_load: 0
        }} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceMetrics />
        <ErrorAnalyticsDashboard />
      </div>
    </Card>
  );
}