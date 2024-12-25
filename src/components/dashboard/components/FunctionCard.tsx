import { Button } from "@/components/ui/button";
import { Play, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { ScheduleManager } from "../ScheduleManager";

interface FunctionCardProps {
  name: string;
  functionName: string;
  loading: string | null;
  onExecute: (functionName: string) => Promise<void>;
  schedule?: any;
}

export function FunctionCard({ name, functionName, loading, onExecute, schedule }: FunctionCardProps) {
  const isLoading = loading === functionName || loading === "all";

  const { data: functionData, isLoading: dataLoading } = useQuery({
    queryKey: ["function-data", functionName],
    queryFn: async () => {
      console.log(`Fetching data for ${functionName}`);
      
      try {
        // Fetch metrics using RPC function
        const { data: metricsData, error: metricsError } = await supabase
          .rpc('get_aggregated_metrics', { hours_lookback: 24 });

        if (metricsError) {
          console.error(`Error fetching metrics for ${functionName}:`, metricsError);
          throw metricsError;
        }

        const metrics = metricsData?.find(m => m.endpoint === functionName);
        console.log(`Metrics data for ${functionName}:`, metrics);

        // Only fetch execution log if we have a valid schedule ID
        let executionLog = null;
        if (schedule?.id) {
          const { data: logData, error: logError } = await supabase
            .from('schedule_execution_logs')
            .select('*')
            .eq('schedule_id', schedule.id)
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (logError && logError.code !== 'PGRST116') {
            console.error(`Error fetching execution log for ${functionName}:`, logError);
            throw logError;
          }
          
          executionLog = logData;
        }

        return {
          metrics,
          schedule,
          lastExecution: executionLog
        };
      } catch (error) {
        console.error(`Error in queryFn for ${functionName}:`, error);
        toast({
          title: "Error fetching function data",
          description: "Failed to load function metrics and execution data",
          variant: "destructive",
        });
        throw error;
      }
    },
    refetchInterval: 30000,
    staleTime: 25000
  });

  const handleManualTrigger = async () => {
    console.log(`Manually triggering ${functionName}`);
    try {
      await onExecute(functionName);
      toast({
        title: "Function Triggered",
        description: `${name} has been manually triggered`,
      });
    } catch (error) {
      console.error(`Error triggering ${functionName}:`, error);
      toast({
        title: "Error",
        description: `Failed to trigger ${name}`,
        variant: "destructive",
      });
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
  };

  const getHealthStatus = (metrics: any) => {
    if (!metrics) return 'info';
    return metrics.health_status;
  };

  const renderScheduleInfo = () => {
    if (!schedule) {
      return <div className="italic">No schedule configured</div>;
    }

    return (
      <>
        <div className="flex justify-between">
          <span>Schedule:</span>
          <span>
            {schedule.frequency_type === 'fixed_interval' && 
              `Every ${schedule.base_interval_minutes} minutes`}
            {schedule.frequency_type === 'daily' && 
              `Daily at ${schedule.fixed_time}`}
            {schedule.frequency_type === 'match_dependent' &&
              `Match day: ${schedule.match_day_interval_minutes}m, Other: ${schedule.non_match_interval_minutes}m`}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Last Run:</span>
          <span>
            {functionData?.lastExecution?.completed_at ? 
              format(new Date(functionData.lastExecution.completed_at), "MMM d, HH:mm:ss") : 
              schedule.last_execution_at ? 
                format(new Date(schedule.last_execution_at), "MMM d, HH:mm:ss") : 
                'Never'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Next Run:</span>
          <span>
            {schedule.next_execution_at ? 
              format(new Date(schedule.next_execution_at), "MMM d, HH:mm:ss") : 
              'Not scheduled'}
          </span>
        </div>
        {functionData?.metrics && (
          <>
            <div className="flex justify-between">
              <span>Success Rate:</span>
              <span>
                {functionData.metrics.total_successes + functionData.metrics.total_errors > 0 
                  ? `${Math.round((functionData.metrics.total_successes / (functionData.metrics.total_successes + functionData.metrics.total_errors)) * 100)}%`
                  : 'N/A'}
              </span>
            </div>
            {functionData.lastExecution?.error_details && (
              <div className="flex justify-between text-destructive">
                <span>Last Error:</span>
                <span className="truncate max-w-[200px]" title={functionData.lastExecution.error_details}>
                  {functionData.lastExecution.error_details}
                </span>
              </div>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <Card className="p-4 bg-background">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold truncate">{name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`h-2 w-2 rounded-full ${
                getHealthStatus(functionData?.metrics) === 'success' ? 'bg-success' :
                getHealthStatus(functionData?.metrics) === 'warning' ? 'bg-warning' :
                getHealthStatus(functionData?.metrics) === 'error' ? 'bg-destructive' :
                'bg-muted'
              }`} />
              <span className="text-sm text-muted-foreground">
                {functionData?.metrics?.avg_response_time ? formatDuration(functionData.metrics.avg_response_time) : 'No data'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualTrigger}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <ScheduleManager
              functionName={functionName}
              functionDisplayName={name}
            />
          </div>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          {dataLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            renderScheduleInfo()
          )}
        </div>
      </div>
    </Card>
  );
}