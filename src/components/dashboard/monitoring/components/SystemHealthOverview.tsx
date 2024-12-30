import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, XCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";

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

  // Ensure metrics exist with default values
  const safeMetrics = {
    success_rate: metrics?.success_rate ?? 0,
    avg_response_time: metrics?.avg_response_time ?? 0,
    error_rate: metrics?.error_rate ?? 0,
    system_load: metrics?.system_load ?? 0
  };

  const getHealthStatus = (rate: number) => {
    if (rate >= 95) return { icon: CheckCircle2, color: 'text-success', status: 'Healthy', indicator: 'bg-success' };
    if (rate >= 80) return { icon: AlertTriangle, color: 'text-warning', status: 'Warning', indicator: 'bg-warning' };
    return { icon: XCircle, color: 'text-destructive', status: 'Critical', indicator: 'bg-destructive' };
  };

  const health = getHealthStatus(safeMetrics.success_rate);
  const Icon = health.icon;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">System Health</h3>
          <p className="text-sm text-muted-foreground">Last 24 hours performance</p>
        </div>
        <div className={`flex items-center gap-2 ${health.color}`}>
          <Icon className="h-5 w-5" />
          <span className="font-medium">{health.status}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Success Rate</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{safeMetrics.success_rate.toFixed(1)}%</span>
              {safeMetrics.success_rate >= 95 ? (
                <ArrowUpRight className="h-4 w-4 text-success" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              )}
            </div>
          </div>
          <Progress value={safeMetrics.success_rate} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>System Load</span>
            <span className="font-medium">{safeMetrics.system_load} requests</span>
          </div>
          <Progress value={Math.min((safeMetrics.system_load / 1000) * 100, 100)} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Avg Response Time</span>
            <p className="text-2xl font-semibold">{safeMetrics.avg_response_time.toFixed(0)}ms</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Error Rate</span>
            <p className="text-2xl font-semibold">{safeMetrics.error_rate.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </Card>
  );
}