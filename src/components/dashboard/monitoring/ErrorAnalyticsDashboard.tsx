import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MetricCard } from "./components/MetricCard";
import { ErrorMetricsChart } from "./components/ErrorMetricsChart";
import { ErrorAnalyticsSummary } from "./components/ErrorAnalyticsSummary";
import { processErrorMetrics } from "./utils/errorMetricsProcessor";
import { ErrorMetrics, RawErrorLog } from "./types/error-analytics";
import { AlertTriangle, Activity, Clock } from "lucide-react";

export function ErrorAnalyticsDashboard() {
  console.log('Rendering ErrorAnalyticsDashboard');

  const { data: errorMetrics, isLoading, error, refetch } = useQuery({
    queryKey: ['error-metrics'],
    queryFn: async () => {
      console.log('Fetching error metrics');
      const { data: metrics, error: metricsError } = await supabase
        .from('api_error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (metricsError) {
        console.error('Error fetching metrics:', metricsError);
        throw metricsError;
      }

      const processedMetrics = processErrorMetrics(metrics as RawErrorLog[]);
      console.log('Processed error metrics:', processedMetrics);
      return processedMetrics;
    },
    refetchInterval: 30000,
    meta: {
      onError: () => {
        toast({
          title: "Error fetching metrics",
          description: "Failed to load error analytics",
          variant: "destructive",
        });
      }
    }
  });

  if (isLoading) {
    return <Skeleton className="w-full h-[400px]" />;
  }

  if (error) {
    return (
      <Card className="p-4">
        <p className="text-destructive">Failed to load error analytics</p>
      </Card>
    );
  }

  const metrics = errorMetrics || [];

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Error Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Errors"
          value={metrics.reduce((sum, m) => sum + m.error_count, 0)}
          subtitle="Last 24 hours"
          icon={AlertTriangle}
          iconColor="text-destructive"
        />
        <MetricCard
          title="Avg Recovery Rate"
          value={`${Math.round(metrics.reduce((sum, m) => sum + m.recovery_rate, 0) / (metrics.length || 1))}%`}
          subtitle="Success rate"
          icon={Activity}
          iconColor="text-green-500"
        />
        <MetricCard
          title="Avg Recovery Time"
          value={`${Math.round(metrics.reduce((sum, m) => sum + (m.avg_recovery_time || 0), 0) / (metrics.length || 1))}s`}
          subtitle="Resolution time"
          icon={Clock}
          iconColor="text-blue-500"
        />
      </div>
      
      <ErrorAnalyticsSummary metrics={metrics} />
      <ErrorMetricsChart data={metrics} />
    </Card>
  );
}