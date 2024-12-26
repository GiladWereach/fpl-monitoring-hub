import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Clock, Server } from "lucide-react";
import { MetricCard } from "./MetricCard";

interface ProcessingMetrics {
  avg_processing_time: number;
  error_rate: number;
  data_quality_score: number;
  system_load?: number;
}

export function PerformanceMetrics() {
  const { data: metrics } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      console.log('Fetching performance metrics');
      const { data, error } = await supabase.rpc('get_processing_metrics', { hours_ago: 24 });
      
      if (error) throw error;

      // Add system_load to match expected interface
      return {
        ...data[0],
        system_load: data[0]?.active_processes || 0
      } as ProcessingMetrics;
    },
    refetchInterval: 30000
  });

  if (!metrics) {
    return null;
  }

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
          value={metrics.system_load?.toString() || '0'}
          subtitle="Active processes"
          icon={Server}
          iconColor="text-amber-500"
        />
      </div>
    </Card>
  );
}