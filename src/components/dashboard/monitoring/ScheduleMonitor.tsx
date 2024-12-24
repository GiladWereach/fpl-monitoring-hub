import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export function ScheduleMonitor() {
  console.log("Rendering ScheduleMonitor");

  const { data: metrics } = useQuery({
    queryKey: ['schedule-metrics'],
    queryFn: async () => {
      console.log('Fetching schedule metrics');
      const { data: healthData, error } = await supabase.rpc('get_aggregated_metrics');
      
      if (error) {
        console.error('Error fetching metrics:', error);
        throw error;
      }
      
      console.log('Schedule metrics:', healthData);
      return healthData;
    },
    refetchInterval: 30000
  });

  const { data: recentExecutions } = useQuery({
    queryKey: ['recent-executions'],
    queryFn: async () => {
      console.log('Fetching recent executions');
      const { data, error } = await supabase
        .from('schedule_execution_logs')
        .select(`
          *,
          schedules (
            function_name
          )
        `)
        .order('started_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching execution logs:', error);
        throw error;
      }

      return data;
    },
    refetchInterval: 15000
  });

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Schedule Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics?.map((metric: any) => (
            <Alert key={metric.endpoint} variant={metric.health_status === 'success' ? 'default' : 'destructive'}>
              <div className="flex items-center gap-2">
                {metric.health_status === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <div>
                  <AlertTitle>{metric.endpoint}</AlertTitle>
                  <AlertDescription>
                    Success Rate: {metric.success_rate}%
                    <br />
                    Avg Response: {metric.avg_response_time}ms
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Recent Executions</h3>
        <div className="space-y-2">
          {recentExecutions?.map((execution) => (
            <Alert 
              key={execution.id}
              variant={execution.status === 'completed' ? 'default' : 'destructive'}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {execution.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : execution.status === 'running' ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <div>
                    <AlertTitle>{execution.schedules?.function_name}</AlertTitle>
                    <AlertDescription>
                      Started: {format(new Date(execution.started_at), "MMM d, HH:mm:ss")}
                      {execution.completed_at && (
                        <> | Duration: {((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000).toFixed(2)}s</>
                      )}
                    </AlertDescription>
                  </div>
                </div>
                <span className={`text-sm ${execution.status === 'completed' ? 'text-green-500' : 'text-red-500'}`}>
                  {execution.status}
                </span>
              </div>
            </Alert>
          ))}
        </div>
      </div>
    </Card>
  );
}