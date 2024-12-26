import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Bell, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function AlertingSystem() {
  const { data: alerts, refetch } = useQuery({
    queryKey: ['system-alerts'],
    queryFn: async () => {
      console.log('Fetching system alerts');
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          alert_notifications (*)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
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
      
      refetch();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="text-xl font-semibold">System Alerts</h2>
        </div>
        <Badge variant="outline">
          {alerts?.filter(a => !a.acknowledged_at).length || 0} Active
        </Badge>
      </div>

      <div className="space-y-4">
        {alerts?.map((alert) => (
          <Card key={alert.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {alert.severity === 'critical' ? (
                  <XCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                )}
                <div>
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(alert.created_at), "MMM d, HH:mm:ss")}
                  </p>
                </div>
              </div>
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
          </Card>
        ))}
      </div>
    </Card>
  );
}