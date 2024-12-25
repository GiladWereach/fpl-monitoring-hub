import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { MetricCard } from "./components/MetricCard";
import { ErrorMetricsChart } from "./components/ErrorMetricsChart";
import { AlertTriangle, CheckCircle2, Clock, Activity } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ErrorMetrics } from "./types/error-analytics";
import { AlertManagement } from "./AlertManagement";

export function MonitoringDashboard() {
  console.log('Rendering MonitoringDashboard');

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      console.log('Fetching system metrics');
      const { data: healthData, error } = await supabase.rpc('get_aggregated_metrics');
      
      if (error) {
        console.error('Error fetching metrics:', error);
        throw error;
      }
      
      console.log('Fetched metrics:', healthData);
      return healthData || [];
    },
    refetchInterval: 30000,
    meta: {
      onError: () => {
        toast({
          title: "Error fetching metrics",
          description: "Failed to load system metrics. Please try again later.",
          variant: "destructive",
        });
      }
    }
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-[300px] bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
          <p>Failed to load monitoring data</p>
        </div>
      </Card>
    );
  }

  const defaultMetrics = {
    success_rate: 0,
    avg_response_time: 0,
    total_errors: 0,
    health_status: 'unknown'
  };

  const aggregatedMetrics = metrics?.[0] || defaultMetrics;

  const errorMetrics: ErrorMetrics[] = metrics?.map((m: any) => ({
    timestamp: m.timestamp,
    error_count: m.error_count || 0,
    recovery_rate: m.success_rate || 0,
    avg_recovery_time: m.avg_response_time || 0
  })) || [];

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        <h2 className="text-2xl font-bold">System Monitoring</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Success Rate"
            value={`${aggregatedMetrics.success_rate?.toFixed(1)}%`}
            icon={CheckCircle2}
            iconColor="text-green-500"
            subtitle="Last 24 hours"
          />
          <MetricCard
            title="Average Response Time"
            value={`${aggregatedMetrics.avg_response_time?.toFixed(0)}ms`}
            icon={Clock}
            iconColor="text-blue-500"
            subtitle="Last 24 hours"
          />
          <MetricCard
            title="Error Count"
            value={aggregatedMetrics.total_errors?.toString() || '0'}
            icon={AlertTriangle}
            iconColor="text-red-500"
            subtitle="Last 24 hours"
          />
          <MetricCard
            title="System Health"
            value={aggregatedMetrics.health_status || 'Unknown'}
            icon={Activity}
            iconColor="text-purple-500"
            subtitle="Current Status"
            indicator={{
              color: aggregatedMetrics.health_status === 'success' 
                ? 'bg-green-500' 
                : aggregatedMetrics.health_status === 'warning'
                ? 'bg-yellow-500'
                : 'bg-red-500',
              show: true
            }}
          />
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Error Metrics Trend</h3>
          <ErrorMetricsChart data={errorMetrics} />
        </div>
      </Card>

      <AlertManagement />
    </div>
  );
}