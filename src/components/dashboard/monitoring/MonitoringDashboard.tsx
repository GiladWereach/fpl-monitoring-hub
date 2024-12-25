import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { MetricCard } from "./components/MetricCard";
import { ErrorMetricsChart } from "./components/ErrorMetricsChart";
import { AlertTriangle, CheckCircle2, Clock, Activity } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ErrorMetrics } from "./types/error-analytics";
import { AlertManagement } from "./AlertManagement";
import { PerformanceTrendChart } from "./components/PerformanceTrendChart";
import { SystemHealthOverview } from "./components/SystemHealthOverview";
import { useState } from "react";

interface AggregatedMetric {
  endpoint: string;
  total_successes: number;
  total_errors: number;
  avg_response_time: number;
  success_rate: number;
  latest_success: string;
  latest_error: string;
  health_status: string;
}

export function MonitoringDashboard() {
  console.log('Rendering MonitoringDashboard');
  const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week'>('day');

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['system-metrics', timeRange],
    queryFn: async () => {
      console.log('Fetching system metrics');
      const { data: healthData, error } = await supabase.rpc('get_aggregated_metrics');
      
      if (error) {
        console.error('Error fetching metrics:', error);
        toast({
          title: "Error fetching metrics",
          description: "Failed to load system metrics",
          variant: "destructive",
        });
        throw error;
      }
      
      console.log('Fetched metrics:', healthData);
      return healthData as AggregatedMetric[];
    },
    refetchInterval: 30000
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
        <div className="text-center text-destructive">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
          <p>Failed to load monitoring data</p>
        </div>
      </Card>
    );
  }

  // Calculate aggregated metrics from the actual API response
  const aggregatedMetrics = {
    success_rate: metrics?.[0]?.success_rate || 0,
    avg_response_time: metrics?.[0]?.avg_response_time || 0,
    error_rate: 100 - (metrics?.[0]?.success_rate || 0),
    system_load: metrics?.[0]?.total_successes + metrics?.[0]?.total_errors || 0 // Calculate system load from total requests
  };

  // Transform metrics for trend chart with proper timestamps
  const trendData = metrics?.map(m => ({
    timestamp: m.latest_success || m.latest_error || new Date().toISOString(), // Use the latest timestamp available
    success_rate: m.success_rate,
    avg_response_time: m.avg_response_time,
    error_count: m.total_errors
  })) || [];

  const errorMetrics: ErrorMetrics[] = metrics?.map((m: any) => ({
    timestamp: m.latest_success || m.latest_error || new Date().toISOString(),
    error_count: m.total_errors || 0,
    recovery_rate: m.success_rate || 0,
    avg_recovery_time: m.avg_response_time || 0
  })) || [];

  return (
    <div className="space-y-6">
      <SystemHealthOverview metrics={aggregatedMetrics} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Success Rate"
          value={`${aggregatedMetrics.success_rate.toFixed(1)}%`}
          icon={CheckCircle2}
          iconColor="text-success"
          subtitle="Last 24 hours"
        />
        <MetricCard
          title="Average Response Time"
          value={`${aggregatedMetrics.avg_response_time.toFixed(0)}ms`}
          icon={Clock}
          iconColor="text-blue-500"
          subtitle="Last 24 hours"
        />
        <MetricCard
          title="Error Rate"
          value={`${aggregatedMetrics.error_rate.toFixed(1)}%`}
          icon={AlertTriangle}
          iconColor="text-destructive"
          subtitle="Last 24 hours"
        />
        <MetricCard
          title="System Load"
          value={`${aggregatedMetrics.system_load} req/24h`}
          icon={Activity}
          iconColor="text-purple-500"
          subtitle="Total Requests"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceTrendChart 
          data={trendData}
          timeRange={timeRange}
        />
        <ErrorMetricsChart data={errorMetrics} />
      </div>

      <AlertManagement />
    </div>
  );
}