import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface SystemMetricsOverviewProps {
  metrics: any[];
  isLoading: boolean;
  error: Error | null;
}

export function SystemMetricsOverview({ metrics, isLoading, error }: SystemMetricsOverviewProps) {
  console.log("Rendering SystemMetricsOverview with metrics:", metrics);

  const handleExport = async () => {
    try {
      const csvContent = [
        ["Endpoint", "Success Rate", "Response Time", "Health Status"],
        ...(metrics || []).map(m => [
          m.endpoint,
          `${m.success_rate ?? 0}%`,
          `${m.avg_response_time ?? 0}ms`,
          m.health_status ?? 'unknown'
        ])
      ].map(row => row.join(",")).join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-metrics-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Metrics exported successfully",
      });
    } catch (error) {
      console.error("Error exporting metrics:", error);
      toast({
        title: "Error",
        description: "Failed to export metrics",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-8 w-full" />
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <Skeleton className="h-[300px] w-full" />
        </Card>
      </div>
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

  // Ensure metrics is an array and calculate high-level metrics with null checks
  const metricsArray = Array.isArray(metrics) ? metrics : [];
  const overallSuccessRate = metricsArray.length > 0 
    ? metricsArray.reduce((acc, m) => acc + (parseFloat(m?.success_rate) || 0), 0) / metricsArray.length 
    : 0;
  const avgResponseTime = metricsArray.length > 0
    ? Math.round(metricsArray.reduce((acc, m) => acc + (m?.avg_response_time || 0), 0) / metricsArray.length)
    : 0;
  const healthyEndpoints = metricsArray.filter(m => m?.health_status === 'success').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">System Metrics</h2>
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-2">Overall Success Rate</h3>
          <p className="text-2xl font-bold">{overallSuccessRate?.toFixed(1) ?? '0.0'}%</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-2">Healthy Endpoints</h3>
          <p className="text-2xl font-bold">{healthyEndpoints}/{metricsArray.length || 0}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-2">Avg Response Time</h3>
          <p className="text-2xl font-bold">{avgResponseTime || 0}ms</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Performance Trends</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="endpoint" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="success_rate" 
                stroke="#10b981" 
                name="Success Rate (%)" 
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avg_response_time" 
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