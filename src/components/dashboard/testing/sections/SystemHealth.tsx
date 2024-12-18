import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { SystemHealthMetrics } from "@/types/metrics";

export function SystemHealth() {
  const { data: healthMetrics } = useQuery<SystemHealthMetrics>({
    queryKey: ['system-health-metrics'],
    queryFn: async () => {
      console.log('Fetching system health metrics...');
      const { data, error } = await supabase
        .from('system_accuracy')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching system health metrics:', error);
        throw error;
      }

      // Transform the data to match our SystemHealthMetrics interface
      const metrics: SystemHealthMetrics = {
        health_score: data?.metrics?.health_score || 0,
        performance_indicators: {
          response_time: data?.metrics?.performance_indicators?.response_time || 0,
          error_rate: data?.metrics?.performance_indicators?.error_rate || 0,
          uptime: data?.metrics?.performance_indicators?.uptime || 100
        }
      };

      return metrics;
    }
  });

  const getHealthStatus = (score: number) => {
    if (score >= 90) return { color: 'text-green-500', icon: CheckCircle2, text: 'Healthy' };
    if (score >= 70) return { color: 'text-yellow-500', icon: AlertTriangle, text: 'Warning' };
    return { color: 'text-red-500', icon: AlertTriangle, text: 'Critical' };
  };

  const healthScore = healthMetrics?.health_score || 0;
  const status = getHealthStatus(healthScore);
  const Icon = status.icon;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">System Health Overview</h3>
        <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
          <div className="flex items-center gap-4">
            <Icon className={`h-8 w-8 ${status.color}`} />
            <div>
              <p className="font-medium">System Status: {status.text}</p>
              <p className="text-sm text-muted-foreground">
                Health Score: {healthScore}/100
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-background/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Response Time</p>
            <p className="text-2xl font-bold">
              {healthMetrics?.performance_indicators?.response_time || 0}ms
            </p>
          </div>
          <div className="p-4 bg-background/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Error Rate</p>
            <p className="text-2xl font-bold">
              {healthMetrics?.performance_indicators?.error_rate || 0}%
            </p>
          </div>
          <div className="p-4 bg-background/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Uptime</p>
            <p className="text-2xl font-bold">
              {healthMetrics?.performance_indicators?.uptime || 100}%
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}