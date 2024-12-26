import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MetricCard } from "./components/MetricCard";
import { ErrorAnalyticsSummary } from "./components/ErrorAnalyticsSummary";
import { AlertThresholds } from "./components/AlertThresholds";
import { PerformanceMetrics } from "./components/PerformanceMetrics";
import { ThresholdConfigDialog } from "./components/ThresholdConfigDialog";
import { HistoricalMetricsChart } from "./components/HistoricalMetricsChart";
import { processErrorMetrics } from "./utils/errorMetricsProcessor";
import { mapDatabaseToAlertThresholds } from "./utils/thresholdMapper";
import { ErrorMetrics, AlertThreshold, PerformanceMetrics as PerformanceMetricsType } from "./types/error-analytics";
import { ThresholdConfig } from "./types/threshold-config";
import { AlertTriangle, Activity, Clock } from "lucide-react";

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

  const { data: thresholds } = useQuery({
    queryKey: ['monitoring-thresholds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monitoring_thresholds')
        .select('*');
      
      if (error) throw error;
      return mapDatabaseToAlertThresholds(data);
    }
  });

  const defaultAlertThresholds: AlertThreshold[] = [
    {
      metric: "Error Rate",
      warning: 5,
      critical: 10,
      currentValue: 3,
      status: 'normal'
    },
    {
      metric: "Response Time",
      warning: 1000,
      critical: 2000,
      currentValue: 800,
      status: 'normal'
    }
  ];

  const defaultPerformanceMetrics: PerformanceMetricsType = {
    avg_processing_time: 245,
    error_rate: 2.5,
    data_quality_score: 95,
    active_processes: 120
  };

  const handleThresholdUpdate = async (config: ThresholdConfig) => {
    try {
      const { error } = await supabase
        .from('monitoring_thresholds')
        .upsert({
          metric_name: config.metricName,
          warning_threshold: config.warningThreshold,
          critical_threshold: config.criticalThreshold,
          enabled: config.enabled,
          notify_on_warning: config.notifyOnWarning,
          notify_on_critical: config.notifyOnCritical,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Send test alert
      if (config.enabled) {
        await supabase.functions.invoke('send-monitoring-alert', {
          body: {
            type: 'warning',
            message: 'Test alert after threshold update',
            details: {
              metric: config.metricName,
              value: 0,
              threshold: config.warningThreshold,
              timestamp: new Date().toISOString()
            },
            recipients: ['test@example.com'] // Replace with actual recipients
          }
        });
      }

      toast({
        title: "Thresholds Updated",
        description: "Monitoring thresholds have been saved successfully",
      });
    } catch (error) {
      console.error('Error updating thresholds:', error);
      toast({
        title: "Error",
        description: "Failed to update thresholds",
        variant: "destructive",
      });
    }
  };

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Error Analytics</h2>
        <ThresholdConfigDialog
          currentConfig={{
            metricName: "Error Rate",
            warningThreshold: 5,
            criticalThreshold: 10,
            enabled: true,
            notifyOnWarning: true,
            notifyOnCritical: true
          }}
          onSave={handleThresholdUpdate}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Errors"
          value={metrics.reduce((sum, m) => sum + m.error_count, 0).toString()}
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
      
      <AlertThresholds thresholds={thresholds || defaultAlertThresholds} />
      <PerformanceMetrics metrics={defaultPerformanceMetrics} />
      <ErrorAnalyticsSummary metrics={metrics} />
      <HistoricalMetricsChart 
        data={metrics.map(m => ({
          timestamp: m.timestamp,
          value: m.error_count,
          threshold: 5
        }))}
        metricName="Error Count"
      />
    </Card>
  );
}
