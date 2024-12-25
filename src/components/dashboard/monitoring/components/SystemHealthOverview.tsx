import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface SystemHealthProps {
  metrics: {
    success_rate: number;
    avg_response_time: number;
    error_rate: number;
    system_load: number;
  };
}

export function SystemHealthOverview({ metrics }: SystemHealthProps) {
  console.log('Rendering SystemHealthOverview with metrics:', metrics);

  const getHealthStatus = (rate: number) => {
    if (rate >= 95) return { icon: CheckCircle2, color: 'text-success', status: 'Healthy' };
    if (rate >= 80) return { icon: AlertTriangle, color: 'text-warning', status: 'Warning' };
    return { icon: XCircle, color: 'text-destructive', status: 'Critical' };
  };

  const health = getHealthStatus(metrics.success_rate);
  const Icon = health.icon;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">System Health</h3>
        <div className={`flex items-center gap-2 ${health.color}`}>
          <Icon className="h-5 w-5" />
          <span>{health.status}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Success Rate</span>
            <span className="font-medium">{metrics.success_rate.toFixed(1)}%</span>
          </div>
          <Progress value={metrics.success_rate} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>System Load</span>
            <span className="font-medium">{metrics.system_load.toFixed(1)}%</span>
          </div>
          <Progress value={metrics.system_load} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Avg Response Time</span>
            <p className="text-2xl font-semibold">{metrics.avg_response_time.toFixed(0)}ms</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Error Rate</span>
            <p className="text-2xl font-semibold">{metrics.error_rate.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </Card>
  );
}