import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ExecutionMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageInterval: number;
  matchDayAccuracy: number;
  lastExecution: Date | null;
}

export async function getExecutionMetrics(functionName: string, hours: number = 24): Promise<ExecutionMetrics> {
  console.log(`Fetching execution metrics for ${functionName} over last ${hours} hours`);
  
  try {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const { data: logs, error } = await supabase
      .from('schedule_execution_logs')
      .select(`
        *,
        schedules!inner (
          function_name
        )
      `)
      .eq('schedules.function_name', functionName)
      .gte('started_at', startTime.toISOString())
      .order('started_at', { ascending: true });

    if (error) throw error;

    if (!logs?.length) {
      console.log(`No execution logs found for ${functionName}`);
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageInterval: 0,
        matchDayAccuracy: 0,
        lastExecution: null
      };
    }

    // Calculate metrics
    const successful = logs.filter(log => log.status === 'completed');
    const intervals: number[] = [];
    
    for (let i = 1; i < logs.length; i++) {
      const interval = new Date(logs[i].started_at).getTime() - 
                      new Date(logs[i-1].started_at).getTime();
      intervals.push(interval / 1000 / 60); // Convert to minutes
    }

    const averageInterval = intervals.length ? 
      intervals.reduce((a, b) => a + b, 0) / intervals.length : 
      0;

    // Calculate match day accuracy
    const matchDayIntervals = intervals.filter(interval => interval <= 2.5); // Allow 0.5min buffer
    const matchDayAccuracy = matchDayIntervals.length ? 
      (matchDayIntervals.length / intervals.length) * 100 : 
      0;

    console.log(`Metrics calculated for ${functionName}:`, {
      totalExecutions: logs.length,
      successfulExecutions: successful.length,
      averageInterval,
      matchDayAccuracy
    });

    return {
      totalExecutions: logs.length,
      successfulExecutions: successful.length,
      failedExecutions: logs.length - successful.length,
      averageInterval,
      matchDayAccuracy,
      lastExecution: logs[logs.length - 1]?.started_at ? new Date(logs[logs.length - 1].started_at) : null
    };
  } catch (error) {
    console.error('Error fetching execution metrics:', error);
    toast({
      title: "Error Fetching Metrics",
      description: "Failed to load execution metrics. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
}