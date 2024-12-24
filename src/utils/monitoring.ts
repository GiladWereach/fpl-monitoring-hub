import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PerformanceMetric {
  component: string;
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
}

const metrics: PerformanceMetric[] = [];

export const measurePerformance = async (
  component: string,
  operation: string,
  callback: () => Promise<any>
): Promise<any> => {
  console.log(`Starting performance measurement for ${component} - ${operation}`);
  const startTime = performance.now();
  let success = true;

  try {
    const result = await callback();
    return result;
  } catch (error) {
    success = false;
    console.error(`Error in ${component} - ${operation}:`, error);
    toast({
      title: "Operation Failed",
      description: `Failed to complete ${operation}. Please try again.`,
      variant: "destructive",
    });
    throw error;
  } finally {
    const duration = performance.now() - startTime;
    const metric: PerformanceMetric = {
      component,
      operation,
      duration,
      timestamp: new Date(),
      success
    };
    
    metrics.push(metric);
    console.log(`Performance metric recorded for ${component}:`, metric);

    // Store metric in Supabase
    try {
      await supabase
        .from('api_health_metrics')
        .insert({
          endpoint: `${component}_${operation}`,
          success_count: success ? 1 : 0,
          error_count: success ? 0 : 1,
          avg_response_time: duration,
          last_success_time: success ? new Date().toISOString() : null,
          last_error_time: success ? null : new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to store performance metric:', error);
    }
  }
};

export const getPerformanceMetrics = () => {
  return metrics;
};

export const clearPerformanceMetrics = () => {
  metrics.length = 0;
};