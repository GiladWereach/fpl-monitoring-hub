import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

export function MetricsPanel() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['scheduler-metrics'],
    queryFn: async () => {
      console.log('Fetching scheduler metrics');
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_aggregated_metrics', { hours_lookback: 24 });

      if (metricsError) {
        console.error('Error fetching metrics:', metricsError);
        throw metricsError;
      }

      console.log('Fetched metrics:', metricsData);
      return metricsData;
    },
    refetchInterval: 30000,
    meta: {
      onError: () => {
        toast({
          title: "Error fetching metrics",
          description: "Failed to load scheduler metrics",
          variant: "destructive",
        });
      }
    }
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-[300px] w-full" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-destructive">
        Error loading metrics: {error.message}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Scheduler Performance</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="endpoint" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="success_rate" stroke="#10b981" name="Success Rate (%)" />
            <Line type="monotone" dataKey="avg_response_time" stroke="#6366f1" name="Avg Response Time (ms)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}