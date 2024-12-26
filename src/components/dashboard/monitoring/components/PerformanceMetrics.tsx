import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Clock, Server } from "lucide-react";
import { MetricCard } from "./MetricCard";

export function PerformanceMetrics() {
  const { data: metrics } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      console.log('Fetching performance metrics');
      const { data, error } = await supabase.rpc('get_processing_metrics', { hours_ago: 24 });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000
  });

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Processing Time"
          value={`${metrics?.avg_processing_time.toFixed(2)}ms`}
          icon={Clock}
          description="Average execution time"
        />
        
        <MetricCard
          title="Error Rate"
          value={`${metrics?.error_rate.toFixed(2)}%`}
          icon={Activity}
          description="Last 24 hours"
          status={metrics?.error_rate < 5 ? 'success' : 'error'}
        />
        
        <MetricCard
          title="System Load"
          value={metrics?.system_load || '0'}
          icon={Server}
          description="Active processes"
        />
      </div>
    </Card>
  );
}