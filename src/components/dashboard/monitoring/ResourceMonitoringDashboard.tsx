import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { persistMetrics } from "./utils/metricsPersistence";
import { performanceTracker } from "./utils/performanceTracker";
import { useEffect, useRef } from "react";
import { ResourceUsageChart } from "./components/ResourceUsageChart";
import { PredictionAccuracyChart } from "./components/PredictionAccuracyChart";
import { MetricsOverview } from "./components/MetricsOverview";

interface ResourceMetric {
  name: string;
  activeTasks: number;
  requestRate: number;
  poolStatus?: { available: number; total: number };
  predictedUsage: PredictionResult;
}

export function ResourceMonitoringDashboard() {
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = performanceTracker.startTracking();
    return () => {
      const metrics = performanceTracker.endTracking(startTimeRef.current);
      console.log('Component performance metrics:', metrics);
    };
  }, []);

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['resource-metrics'],
    queryFn: async () => {
      console.log('Fetching resource metrics');
      try {
        const { data, error } = await supabase
          .rpc('get_aggregated_metrics', { hours_lookback: 24 });

        if (error) {
          console.error('Error fetching metrics:', error);
          toast({
            title: "Error Fetching Metrics",
            description: error.message || "Failed to fetch resource metrics",
            variant: "destructive",
          });
          throw error;
        }

        if (!data) {
          throw new Error('No metrics data received');
        }

        console.log('Fetched metrics:', data);
        return data;
      } catch (err) {
        console.error('Error in queryFn:', err);
        throw err;
      }
    },
    refetchInterval: 5000,
    retry: 3,
  });

  const hasAnomalies = metrics?.some(m => m.predictedUsage.anomalyScore > 2.0);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load resource metrics. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[300px]" />
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Resource Usage</h2>
        {hasAnomalies && (
          <div className="flex items-center text-amber-500">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span>Anomalies Detected</span>
          </div>
        )}
      </div>

      <MetricsOverview metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResourceUsageChart data={metrics || []} />
        <PredictionAccuracyChart data={metrics || []} />
      </div>
    </Card>
  );
}