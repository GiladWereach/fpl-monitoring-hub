import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

export function AlertManagement() {
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['system-alerts', selectedSeverity],
    queryFn: async () => {
      console.log('Fetching system alerts');
      let query = supabase
        .from('alerts')
        .select(`
          *,
          alert_notifications (*)
        `)
        .order('created_at', { ascending: false });

      if (selectedSeverity !== 'all') {
        query = query.eq('severity', selectedSeverity);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching alerts:', error);
        throw error;
      }

      console.log('Fetched alerts:', data);
      return data;
    },
    refetchInterval: 30000
  });

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alert Acknowledged",
        description: "The alert has been marked as acknowledged",
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'error':
        return 'bg-orange-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <Bell className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">System Alerts</h2>
        <div className="flex gap-2">
          <Button
            variant={selectedSeverity === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedSeverity('all')}
          >
            All
          </Button>
          <Button
            variant={selectedSeverity === 'critical' ? 'default' : 'outline'}
            onClick={() => setSelectedSeverity('critical')}
          >
            Critical
          </Button>
          <Button
            variant={selectedSeverity === 'error' ? 'default' : 'outline'}
            onClick={() => setSelectedSeverity('error')}
          >
            Error
          </Button>
          <Button
            variant={selectedSeverity === 'warning' ? 'default' : 'outline'}
            onClick={() => setSelectedSeverity('warning')}
          >
            Warning
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {alerts?.map((alert) => (
          <Card key={alert.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getSeverityIcon(alert.severity)}
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(alert.created_at), "MMM d, HH:mm:ss")}
                    </span>
                  </div>
                  <p className="mt-1">{alert.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {alert.notification_sent && (
                  <Badge variant="outline" className="gap-2">
                    <Bell className="h-4 w-4" />
                    Notification Sent
                  </Badge>
                )}
                {!alert.acknowledged_at && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    Acknowledge
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}