import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface PerformanceMetrics {
  testName: string;
  executionTime: number;
  memoryUsage: number;
  successRate: number;
}

export async function trackTestPerformance(metrics: PerformanceMetrics) {
  console.log(`Tracking performance metrics for ${metrics.testName}:`, metrics);
  
  try {
    const { error } = await supabase
      .from('api_health_metrics')
      .insert({
        endpoint: `test_${metrics.testName}`,
        avg_response_time: metrics.executionTime,
        success_count: metrics.successRate === 100 ? 1 : 0,
        error_count: metrics.successRate === 100 ? 0 : 1,
        error_pattern: metrics.successRate < 100 ? {
          type: 'performance_degradation',
          details: {
            memory_usage: metrics.memoryUsage,
            execution_time: metrics.executionTime
          }
        } : null
      });

    if (error) throw error;

    if (metrics.executionTime > 5000) {
      toast({
        title: "Performance Warning",
        description: `Test ${metrics.testName} took longer than expected: ${metrics.executionTime}ms`,
        variant: "warning",
      });
    }
  } catch (error) {
    console.error('Error tracking performance metrics:', error);
    toast({
      title: "Error",
      description: "Failed to track performance metrics",
      variant: "destructive",
    });
  }
}

export function measureExecutionTime<T>(
  fn: () => Promise<T>,
  testName: string
): Promise<T> {
  console.log(`Starting execution time measurement for ${testName}`);
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed;

  return fn().then(async (result) => {
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;
    
    await trackTestPerformance({
      testName,
      executionTime: endTime - startTime,
      memoryUsage: endMemory - startMemory,
      successRate: 100
    });

    return result;
  }).catch(async (error) => {
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;
    
    await trackTestPerformance({
      testName,
      executionTime: endTime - startTime,
      memoryUsage: endMemory - startMemory,
      successRate: 0
    });

    throw error;
  });
}