import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ResourceManager } from "@/components/backend/scheduler/utils/resourceManager";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { Activity, Server, Clock, AlertTriangle } from "lucide-react";
import { MetricCard } from "./components/MetricCard";
import { PredictionResult } from "@/components/backend/scheduler/utils/resourcePredictor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { persistMetrics } from "./utils/metricsPersistence";
import { performanceTracker } from "./utils/performanceTracker";
import { useEffect, useRef } from "react";

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
        const resourceManager = ResourceManager.getInstance();
        const functions = ['fetch-live-gameweek', 'fetch-fixtures', 'process-schedules'];
        
        const rawMetrics = functions.map(fn => ({
          name: fn,
          ...resourceManager.getResourceMetrics(fn)
        }));

        // Validate metrics data
        const validatedMetrics = rawMetrics.map(metric => {
          if (!metric.predictedUsage || typeof metric.predictedUsage.confidence !== 'number') {
            console.error(`Invalid prediction data for ${metric.name}:`, metric.predictedUsage);
            throw new Error(`Invalid prediction data for ${metric.name}`);
          }
          return metric;
        });

        // Persist metrics with performance data
        const performanceData = performanceTracker.endTracking(startTimeRef.current);
        await persistMetrics(validatedMetrics, {
          render_time: performanceData.renderTime,
          memory_usage: performanceData.memoryUsage
        });

        return validatedMetrics as ResourceMetric[];
      } catch (err) {
        console.error('Error fetching metrics:', err);
        toast({
          title: "Error Fetching Metrics",
          description: "Failed to fetch resource metrics. Please try again.",
          variant: "destructive",
        });
        throw err;
      }
    },
    refetchInterval: 5000,
    retry: 3,
    meta: {
      errorMessage: "Failed to fetch resource metrics"
    }
  });

  console.log('Current resource metrics:', metrics);

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

  const hasAnomalies = metrics?.some(m => m.predictedUsage.anomalyScore > 2.0);

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Active Tasks"
          value={metrics?.reduce((sum, m) => sum + m.activeTasks, 0)?.toString() || '0'}
          subtitle="Current executions"
          icon={Activity}
          iconColor="text-blue-500"
        />
        
        <MetricCard
          title="Request Rate"
          value={`${metrics?.reduce((sum, m) => sum + m.requestRate, 0) || 0}/min`}
          subtitle="Across all functions"
          icon={Clock}
          iconColor="text-amber-500"
        />
        
        <MetricCard
          title="Pool Utilization"
          value={(() => {
            const pools = metrics?.filter(m => m.poolStatus).map(m => m.poolStatus!);
            if (!pools?.length) return '0%';
            const used = pools.reduce((sum, p) => sum + (p.total - p.available), 0);
            const total = pools.reduce((sum, p) => sum + p.total, 0);
            return `${Math.round((used / total) * 100)}%`;
          })()}
          subtitle="Resource pool usage"
          icon={Server}
          iconColor="text-green-500"
        />

        <MetricCard
          title="Prediction Confidence"
          value={(() => {
            if (!metrics?.length) return 'N/A';
            const avgConfidence = metrics.reduce((sum, m) => sum + m.predictedUsage.confidence, 0) / metrics.length;
            return `${Math.round(avgConfidence * 100)}%`;
          })()}
          subtitle="Resource prediction accuracy"
          icon={AlertTriangle}
          iconColor="text-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-4">Resource Usage Trends</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="activeTasks" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                  name="Active Tasks" 
                />
                <Area 
                  type="monotone" 
                  dataKey="requestRate" 
                  stackId="2"
                  stroke="#f59e0b" 
                  fill="#f59e0b"
                  fillOpacity={0.3}
                  name="Request Rate" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium mb-4">Prediction Accuracy</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="predictedUsage.predictedUsage" 
                  stroke="#8b5cf6" 
                  name="Predicted Usage" 
                />
                <Line 
                  type="monotone" 
                  dataKey="predictedUsage.confidence" 
                  stroke="#10b981" 
                  name="Confidence" 
                />
                <Line 
                  type="monotone" 
                  dataKey="predictedUsage.anomalyScore" 
                  stroke="#ef4444" 
                  name="Anomaly Score" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </Card>
  );
}