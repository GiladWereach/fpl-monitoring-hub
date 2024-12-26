import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { APIHealthStatus } from "@/components/monitoring/APIHealthStatus";
import { SystemHealthOverview } from "@/components/dashboard/monitoring/components/SystemHealthOverview";
import { PerformanceMetrics } from "@/components/dashboard/monitoring/components/PerformanceMetrics";
import { ErrorAnalyticsDashboard } from "@/components/dashboard/monitoring/ErrorAnalyticsDashboard";

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
      
      console.log('Fetched metrics:', healthData);
      return healthData;
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
        <SystemHealthOverview metrics={metrics} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceMetrics />
        <ErrorAnalyticsDashboard />
      </div>
    </Card>
  );
}