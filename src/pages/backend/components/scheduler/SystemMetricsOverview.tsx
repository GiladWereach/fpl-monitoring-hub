import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface SystemMetricsOverviewProps {
  metrics: any[];
  isLoading: boolean;
  error: Error | null;
}

export function SystemMetricsOverview({ metrics, isLoading, error }: SystemMetricsOverviewProps) {
  console.log("Rendering SystemMetricsOverview with metrics:", metrics);

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-[300px] w-full" />
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading metrics: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  const metricsData = metrics?.map(m => ({
    name: m.endpoint,
    successRate: parseFloat(m.success_rate),
    responseTime: m.avg_response_time,
    health: m.health_status
  }));

  return (
    <div className="grid gap-6">
      {/* High-level metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-2">Overall Success Rate</h3>
          <p className="text-2xl font-bold">
            {metrics?.reduce((acc, m) => acc + parseFloat(m.success_rate), 0) / (metrics?.length || 1)}%
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-2">Active Functions</h3>
          <p className="text-2xl font-bold">{metrics?.length || 0}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-2">Avg Response Time</h3>
          <p className="text-2xl font-bold">
            {Math.round(metrics?.reduce((acc, m) => acc + m.avg_response_time, 0) / (metrics?.length || 1))}ms
          </p>
        </Card>
      </div>

      {/* Performance trends chart */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Performance Trends</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="successRate" 
                stroke="#10b981" 
                name="Success Rate (%)" 
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="responseTime" 
                stroke="#6366f1" 
                name="Response Time (ms)" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}