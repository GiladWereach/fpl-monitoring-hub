import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ResourceManager } from "@/components/backend/scheduler/utils/resourceManager";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Server, Clock } from "lucide-react";
import { MetricCard } from "./components/MetricCard";

export function ResourceMonitoringDashboard() {
  const { data: metrics } = useQuery({
    queryKey: ['resource-metrics'],
    queryFn: async () => {
      console.log('Fetching resource metrics');
      const resourceManager = ResourceManager.getInstance();
      const functions = ['fetch-live-gameweek', 'fetch-fixtures', 'process-schedules'];
      
      return functions.map(fn => ({
        name: fn,
        ...resourceManager.getResourceMetrics(fn)
      }));
    },
    refetchInterval: 5000
  });

  console.log('Current resource metrics:', metrics);

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-lg font-semibold">Resource Usage</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      <div className="h-[300px] mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metrics || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="activeTasks" stroke="#3b82f6" name="Active Tasks" />
            <Line type="monotone" dataKey="requestRate" stroke="#f59e0b" name="Request Rate" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}