import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LiveStatus } from '@/components/dashboard/LiveStatus';
import { APIHealthStatus } from '@/components/monitoring/APIHealthStatus';
import { Card } from '@/components/ui/card';
import { Database, Server, Activity, Calculator, Clock, Users, BarChart3, AlertTriangle } from 'lucide-react';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';

export default function BackendDashboard() {
  const { data: systemMetrics } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      console.log('Fetching system metrics');
      const [
        { count: totalPlayers } = { count: 0 },
        { count: totalFixtures } = { count: 0 },
        { count: totalEvents } = { count: 0 },
        { count: activeCalculations } = { count: 0 }
      ] = await Promise.all([
        supabase.from('players').select('*', { count: 'exact', head: true }),
        supabase.from('fixtures').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('calculation_logs')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'running')
      ]);

      // Get error rates from last 24h
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: errorLogs } = await supabase
        .from('api_error_logs')
        .select('*')
        .gte('created_at', twentyFourHoursAgo);

      return {
        totalPlayers,
        totalFixtures,
        totalEvents,
        activeCalculations,
        errorCount: errorLogs?.length || 0
      };
    },
    refetchInterval: 30000
  });

  const { data: scheduleStats } = useQuery({
    queryKey: ['schedule-stats'],
    queryFn: async () => {
      console.log('Fetching schedule statistics');
      const { data: schedules } = await supabase
        .from('function_schedules')
        .select('*');

      const activeSchedules = schedules?.filter(s => s.status === 'active').length || 0;
      const totalSchedules = schedules?.length || 0;

      return {
        activeSchedules,
        totalSchedules,
        healthScore: totalSchedules ? (activeSchedules / totalSchedules) * 100 : 100
      };
    },
    refetchInterval: 30000
  });

  return (
    <div className="container mx-auto p-4 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Overview</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage backend operations
          </p>
        </div>
        <LiveStatus />
      </div>

      {/* System Health Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Database Status"
          value="Connected"
          status="success"
          icon={<Database className="h-4 w-4" />}
          details={[
            { label: "Total Players", value: systemMetrics?.totalPlayers || 0 },
            { label: "Total Events", value: systemMetrics?.totalEvents || 0 }
          ]}
        />
        
        <StatusCard
          title="Edge Functions"
          value={`${scheduleStats?.activeSchedules || 0} Active`}
          status={scheduleStats?.healthScore >= 90 ? "success" : "warning"}
          icon={<Server className="h-4 w-4" />}
          details={[
            { label: "Total Functions", value: scheduleStats?.totalSchedules || 0 },
            { label: "Health Score", value: `${Math.round(scheduleStats?.healthScore || 0)}%` }
          ]}
        />

        <StatusCard
          title="Calculations"
          value={`${systemMetrics?.activeCalculations || 0} Running`}
          status={systemMetrics?.activeCalculations ? "info" : "success"}
          icon={<Calculator className="h-4 w-4" />}
          details={[
            { label: "Fixtures", value: systemMetrics?.totalFixtures || 0 },
            { label: "Processing", value: systemMetrics?.activeCalculations || 0 }
          ]}
        />

        <StatusCard
          title="System Errors"
          value={systemMetrics?.errorCount || 0}
          status={systemMetrics?.errorCount === 0 ? "success" : "error"}
          icon={<AlertTriangle className="h-4 w-4" />}
          details={[
            { label: "Last 24h", value: systemMetrics?.errorCount || 0 },
            { label: "Critical", value: "0" }
          ]}
        />
      </div>

      {/* API Health Metrics */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          API Health Metrics
        </h2>
        <APIHealthStatus />
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </h2>
        <RecentActivity />
      </Card>
    </div>
  );
}