import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ErrorMetrics {
  timestamp: string;
  error_count: number;
  recovery_rate: number;
  avg_recovery_time: number;
}

export function ErrorAnalyticsDashboard() {
  console.log('Rendering ErrorAnalyticsDashboard');

  const { data: errorMetrics, isLoading, error } = useQuery({
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

      // Process metrics to get hourly error counts and recovery rates
      const processedMetrics = processErrorMetrics(metrics);
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

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Error Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Total Errors"
          value={errorMetrics?.reduce((sum, m) => sum + m.error_count, 0) || 0}
        />
        <MetricCard
          title="Avg Recovery Rate"
          value={`${Math.round(errorMetrics?.reduce((sum, m) => sum + m.recovery_rate, 0) / (errorMetrics?.length || 1))}%`}
        />
        <MetricCard
          title="Avg Recovery Time"
          value={`${Math.round(errorMetrics?.reduce((sum, m) => sum + m.avg_recovery_time, 0) / (errorMetrics?.length || 1))}s`}
        />
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={errorMetrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Line yAxisId="left" type="monotone" dataKey="error_count" stroke="#ef4444" name="Errors" />
            <Line yAxisId="right" type="monotone" dataKey="recovery_rate" stroke="#22c55e" name="Recovery Rate %" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </Card>
  );
}

function processErrorMetrics(rawMetrics: any[]): ErrorMetrics[] {
  // Group errors by hour
  const hourlyMetrics = rawMetrics.reduce((acc, error) => {
    const hour = new Date(error.created_at).toISOString().slice(0, 13);
    if (!acc[hour]) {
      acc[hour] = {
        error_count: 0,
        recovered_count: 0,
        total_recovery_time: 0
      };
    }
    acc[hour].error_count++;
    
    // Calculate recovery metrics if available
    if (error.retry_count !== null) {
      acc[hour].recovered_count++;
      acc[hour].total_recovery_time += error.retry_count * 60; // Assuming 60s between retries
    }
    return acc;
  }, {} as Record<string, any>);

  // Convert to array format for chart
  return Object.entries(hourlyMetrics).map(([hour, metrics]) => ({
    timestamp: hour,
    error_count: metrics.error_count,
    recovery_rate: metrics.recovered_count / metrics.error_count * 100,
    avg_recovery_time: metrics.total_recovery_time / metrics.recovered_count || 0
  }));
}