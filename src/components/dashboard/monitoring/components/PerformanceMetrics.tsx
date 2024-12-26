import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Clock, Server } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { PerformanceMetrics as PerformanceMetricsType } from "../types/performance-metrics";

interface PerformanceMetricsProps {
  metrics: PerformanceMetricsType;
}

export function PerformanceMetrics({ metrics }: PerformanceMetricsProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Processing Time"
          value={`${metrics.avg_processing_time.toFixed(2)}ms`}
          subtitle="Average execution time"
          icon={Clock}
          iconColor="text-blue-500"
        />
        
        <MetricCard
          title="Error Rate"
          value={`${metrics.error_rate.toFixed(2)}%`}
          subtitle="Last 24 hours"
          icon={Activity}
          iconColor={metrics.error_rate < 5 ? 'text-success' : 'text-destructive'}
          status={metrics.error_rate < 5 ? 'success' : 'error'}
        />
        
        <MetricCard
          title="System Load"
          value={metrics.active_processes?.toString() || '0'}
          subtitle="Active processes"
          icon={Server}
          iconColor="text-amber-500"
        />
      </div>
    </Card>
  );
}