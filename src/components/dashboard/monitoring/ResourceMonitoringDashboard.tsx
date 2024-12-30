import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { AdvancedChartOptions } from "./components/AdvancedChartOptions";
import { MetricAggregation } from "./components/MetricAggregation";
import { AlertConfiguration } from "./components/AlertConfiguration";
import { ResourceUsageChart } from "./components/ResourceUsageChart";
import { PredictionAccuracyChart } from "./components/PredictionAccuracyChart";
import { useState } from "react";

export function ResourceMonitoringDashboard() {
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState({ from: new Date(Date.now() - 24 * 60 * 60 * 1000), to: new Date() });
  const [showComparison, setShowComparison] = useState(false);
  const [aggregationType, setAggregationType] = useState('avg');

  console.log('Rendering ResourceMonitoringDashboard with:', {
    chartType,
    timeRange,
    showComparison,
    aggregationType
  });

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['resource-metrics', timeRange],
    queryFn: async () => {
      console.log('Fetching resource metrics');
      try {
        const { data, error } = await supabase
          .rpc('get_aggregated_metrics', { 
            hours_lookback: Math.ceil((timeRange.to.getTime() - timeRange.from.getTime()) / (1000 * 60 * 60)) 
          });

        if (error) throw error;
        console.log('Fetched metrics:', data);
        return data;
      } catch (err) {
        console.error('Error in queryFn:', err);
        throw err;
      }
    },
    refetchInterval: 30000
  });

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
    return <Skeleton className="w-full h-[400px]" />;
  }

  const handleAggregationChange = (config: any) => {
    console.log('Aggregation config changed:', config);
    // Apply aggregation logic here
    toast({
      title: "Aggregation Updated",
      description: `Applied ${config.type} aggregation with ${config.window}h window`,
    });
  };

  const hasAnomalies = metrics?.some((m: any) => m.health_status === 'error');

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

      <AdvancedChartOptions
        onChartTypeChange={setChartType}
        onTimeRangeChange={setTimeRange}
        onComparisonToggle={setShowComparison}
        onAggregationChange={setAggregationType}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResourceUsageChart 
          data={metrics || []} 
          chartType={chartType}
          showComparison={showComparison}
        />
        <PredictionAccuracyChart data={metrics || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricAggregation 
          metrics={metrics || []}
          onAggregationChange={handleAggregationChange}
        />
        <AlertConfiguration 
          metricName="resource_usage"
          currentConfig={{
            warning: 80,
            critical: 90,
            enabled: true,
            timeWindow: 15,
            notifyOnRecovery: true
          }}
        />
      </div>
    </Card>
  );
}