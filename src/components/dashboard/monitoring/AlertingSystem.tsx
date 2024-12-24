import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
        details: metric.error_pattern
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

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">System Alerts</h3>
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

      <div className="space-y-2">
        {alerts?.map((alert, index) => (
          <Alert key={index} variant={alert.status === 'error' ? 'destructive' : 'default'}>
            <div className="flex items-center gap-2">
              {getAlertIcon(alert.status)}
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{alert.endpoint}</span>
                  <span className="text-sm">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {alert.details && (
                  <p className="text-sm mt-1 text-muted-foreground">
                    {JSON.stringify(alert.details)}
                  </p>
                )}
              </AlertDescription>
            </div>
          </Alert>
        ))}
      </div>
    </Card>
  );
}