import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AlertingSystem() {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['system-alerts'],
    queryFn: async () => {
      console.log('Fetching system alerts');
      const { data: healthMetrics, error } = await supabase
        .from('api_health_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching alerts:', error);
        throw error;
      }

      return healthMetrics?.map(metric => ({
        endpoint: metric.endpoint,
        status: metric.error_count > 0 ? 'error' : 'healthy',
        timestamp: metric.created_at,
        details: metric.error_pattern,
        successCount: metric.success_count,
        errorCount: metric.error_count,
        avgResponseTime: metric.avg_response_time
      }));
    },
    refetchInterval: 30000
  });

  const getAlertIcon = (status: string) => {
    switch (status) {
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-success" />;
    }
  };

  if (isLoading) {
    return null;
  }

  const getHealthStatus = (successCount: number, errorCount: number) => {
    const total = successCount + errorCount;
    const successRate = total > 0 ? (successCount / total) * 100 : 100;
    if (successRate >= 95) return 'healthy';
    if (successRate >= 80) return 'warning';
    return 'error';
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">System Health</h3>
        <div className="flex items-center gap-2">
          <Switch
            id="alerts-enabled"
            onCheckedChange={(checked) => {
              toast({
                title: checked ? "Alerts Enabled" : "Alerts Disabled",
                description: checked 
                  ? "You will now receive system alerts" 
                  : "System alerts have been disabled",
              });
            }}
          />
          <Bell className="h-4 w-4" />
        </div>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {alerts?.map((alert, index) => {
            const status = getHealthStatus(alert.successCount, alert.errorCount);
            return (
              <Alert 
                key={index} 
                variant={status === 'error' ? 'destructive' : status === 'warning' ? 'default' : 'default'}
                className="border-l-4 border-l-primary"
              >
                <div className="flex items-center gap-2">
                  {getAlertIcon(status)}
                  <AlertDescription>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{alert.endpoint}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm grid grid-cols-3 gap-2">
                        <span>Success: {alert.successCount}</span>
                        <span>Errors: {alert.errorCount}</span>
                        <span>Avg Time: {alert.avgResponseTime?.toFixed(2)}ms</span>
                      </div>
                    </div>
                  </AlertDescription>
                </div>
              </Alert>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}