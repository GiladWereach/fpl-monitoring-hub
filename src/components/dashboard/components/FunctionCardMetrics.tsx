interface FunctionCardMetricsProps {
  metrics?: any;
}

export function FunctionCardMetrics({ metrics }: FunctionCardMetricsProps) {
  const getHealthStatus = (metrics: any) => {
    if (!metrics) return 'info';
    return metrics.health_status;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <span className={`h-2 w-2 rounded-full ${
        getHealthStatus(metrics) === 'success' ? 'bg-success' :
        getHealthStatus(metrics) === 'warning' ? 'bg-warning' :
        getHealthStatus(metrics) === 'error' ? 'bg-destructive' :
        'bg-muted'
      }`} />
      <span className="text-sm text-muted-foreground">
        {metrics?.avg_response_time ? formatDuration(metrics.avg_response_time) : 'No data'}
      </span>
    </div>
  );
}