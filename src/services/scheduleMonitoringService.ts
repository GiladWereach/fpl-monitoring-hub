import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface MonitoringMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  matchDayIntervalAccuracy: number;
  nonMatchIntervalAccuracy: number;
}

export async function getScheduleMonitoringMetrics(
  scheduleId: string,
  timeWindowHours: number = 24
): Promise<MonitoringMetrics> {
  console.log(`Fetching monitoring metrics for schedule ${scheduleId}`);
  
  try {
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - timeWindowHours);

    const { data: executionLogs, error } = await supabase
      .from('schedule_execution_logs')
      .select('*')
      .eq('schedule_id', scheduleId)
      .gte('started_at', windowStart.toISOString())
      .order('started_at', { ascending: true });

    if (error) throw error;

    if (!executionLogs?.length) {
      console.log('No execution logs found in the specified time window');
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        matchDayIntervalAccuracy: 0,
        nonMatchIntervalAccuracy: 0
      };
    }

    // Calculate basic metrics
    const successfulLogs = executionLogs.filter(log => log.status === 'completed');
    const failedLogs = executionLogs.filter(log => log.status === 'failed');
    const executionTimes = successfulLogs
      .map(log => log.execution_duration_ms)
      .filter(duration => duration != null) as number[];

    // Calculate interval accuracies
    const intervalAccuracies = calculateIntervalAccuracies(executionLogs);

    const metrics: MonitoringMetrics = {
      totalExecutions: executionLogs.length,
      successfulExecutions: successfulLogs.length,
      failedExecutions: failedLogs.length,
      averageExecutionTime: executionTimes.length ? 
        executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length : 0,
      matchDayIntervalAccuracy: intervalAccuracies.matchDayAccuracy,
      nonMatchIntervalAccuracy: intervalAccuracies.nonMatchAccuracy
    };

    console.log('Calculated monitoring metrics:', metrics);
    return metrics;
  } catch (error) {
    console.error('Error fetching monitoring metrics:', error);
    toast({
      title: "Monitoring Error",
      description: "Failed to fetch monitoring metrics",
      variant: "destructive",
    });
    throw error;
  }
}

function calculateIntervalAccuracies(logs: any[]) {
  let matchDayIntervals: number[] = [];
  let nonMatchIntervals: number[] = [];

  for (let i = 1; i < logs.length; i++) {
    const currentLog = logs[i];
    const previousLog = logs[i - 1];
    
    const intervalMinutes = (
      new Date(currentLog.started_at).getTime() - 
      new Date(previousLog.started_at).getTime()
    ) / (1000 * 60);

    // Check execution context to determine if it was during match day
    const isMatchDay = currentLog.execution_context?.isMatchDay;
    
    if (isMatchDay) {
      matchDayIntervals.push(intervalMinutes);
    } else {
      nonMatchIntervals.push(intervalMinutes);
    }
  }

  // Calculate accuracy (how close to target intervals)
  const matchDayAccuracy = calculateIntervalAccuracy(matchDayIntervals, 2); // Target: 2 minutes
  const nonMatchAccuracy = calculateIntervalAccuracy(nonMatchIntervals, 30); // Target: 30 minutes

  return {
    matchDayAccuracy,
    nonMatchAccuracy
  };
}

function calculateIntervalAccuracy(intervals: number[], targetInterval: number): number {
  if (!intervals.length) return 0;
  
  const deviations = intervals.map(interval => 
    Math.abs(interval - targetInterval) / targetInterval
  );
  
  const averageDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  return Math.max(0, 100 * (1 - averageDeviation));
}