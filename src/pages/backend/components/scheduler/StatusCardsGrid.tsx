import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface StatusCardsGridProps {
  metrics: any;
  isLoading: boolean;
  error: Error | null;
}

export function StatusCardsGrid({ metrics, isLoading, error }: StatusCardsGridProps) {
  console.log("Rendering StatusCardsGrid with metrics:", metrics);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-8 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-4 text-destructive">
        Error loading metrics: {error.message}
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-success/10 text-success';
      case 'warning':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-destructive/10 text-destructive';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics?.map((metric: any) => (
        <Card key={metric.endpoint} className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-sm">{metric.endpoint}</h3>
            <Badge className={getStatusColor(metric.health_status)}>
              <span className="flex items-center gap-1">
                {getStatusIcon(metric.health_status)}
                {metric.health_status}
              </span>
            </Badge>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Success Rate:</span>
              <span>{metric.success_rate}%</span>
            </div>
            <div className="flex justify-between">
              <span>Response Time:</span>
              <span>{metric.avg_response_time}ms</span>
            </div>
            <div className="flex justify-between">
              <span>Last Success:</span>
              <span>{metric.latest_success ? new Date(metric.latest_success).toLocaleTimeString() : 'N/A'}</span>
            </div>
            {metric.latest_error && (
              <div className="flex justify-between text-destructive">
                <span>Last Error:</span>
                <span>{new Date(metric.latest_error).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}