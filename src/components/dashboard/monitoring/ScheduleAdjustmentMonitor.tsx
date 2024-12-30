import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";

export function ScheduleAdjustmentMonitor() {
  console.log("Rendering ScheduleAdjustmentMonitor");

  const { data: adjustments, isLoading } = useQuery({
    queryKey: ['schedule-adjustments'],
    queryFn: async () => {
      console.log('Fetching schedule adjustment metrics');
      const { data, error } = await supabase
        .from('api_health_metrics')
        .select('*')
        .eq('endpoint', 'adjust_schedule_intervals')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching adjustment metrics:', error);
        throw error;
      }

      console.log('Fetched adjustment metrics:', data);
      return data;
    },
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center">
          <Clock className="h-4 w-4 animate-spin" />
          <span className="ml-2">Loading metrics...</span>
        </div>
      </Card>
    );
  }

  const latestAdjustment = adjustments?.[0];
  const successRate = adjustments?.length ? 
    (adjustments.filter(a => a.success_count > 0).length / adjustments.length) * 100 : 
    0;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Schedule Adjustments</h3>
        {successRate >= 95 ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <AlertCircle className="h-5 w-5 text-warning" />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Success Rate</p>
          <p className="text-lg font-medium">{successRate.toFixed(1)}%</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Last Adjustment</p>
          <p className="text-lg font-medium">
            {latestAdjustment?.created_at ? 
              format(new Date(latestAdjustment.created_at), "HH:mm:ss") : 
              'Never'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Schedules Updated</p>
          <p className="text-lg font-medium">
            {latestAdjustment?.error_pattern?.schedules_updated || 0}
          </p>
        </div>
      </div>

      {latestAdjustment?.error_pattern?.state_change && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Last state change: {latestAdjustment.error_pattern.state_change.from} → {latestAdjustment.error_pattern.state_change.to}
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}