import { supabase } from "@/integrations/supabase/client";

export interface ErrorPattern {
  type: string;
  count: number;
  lastOccurrence: Date;
  avgResponseTime: number;
}

export interface AggregatedMetrics {
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  errorPatterns: ErrorPattern[];
  timeDistribution: {
    hour: number;
    count: number;
    successRate: number;
  }[];
}

export async function aggregateMetrics(endpoint: string, hours: number = 24): Promise<AggregatedMetrics> {
  console.log(`Aggregating metrics for ${endpoint} over last ${hours} hours`);
  
  const { data: metrics, error } = await supabase
    .from('api_health_metrics')
    .select('*')
    .eq('endpoint', endpoint)
    .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error('Error fetching metrics:', error);
    throw error;
  }

  // Process error patterns
  const errorPatterns = metrics
    .filter(m => m.error_pattern)
    .reduce((acc: ErrorPattern[], m) => {
      const pattern = m.error_pattern as { type: string };
      const existing = acc.find(p => p.type === pattern.type);
      
      if (existing) {
        existing.count++;
        existing.avgResponseTime = (existing.avgResponseTime + m.avg_response_time) / 2;
        if (new Date(m.created_at) > new Date(existing.lastOccurrence)) {
          existing.lastOccurrence = new Date(m.created_at);
        }
      } else {
        acc.push({
          type: pattern.type,
          count: 1,
          lastOccurrence: new Date(m.created_at),
          avgResponseTime: m.avg_response_time
        });
      }
      
      return acc;
    }, []);

  // Calculate time distribution
  const timeDistribution = metrics.reduce((acc: any[], m) => {
    const hour = new Date(m.created_at).getHours();
    const entry = acc.find(a => a.hour === hour);
    
    if (entry) {
      entry.count++;
      entry.successRate = (entry.successRate * (entry.count - 1) + (m.success_count > 0 ? 100 : 0)) / entry.count;
    } else {
      acc.push({
        hour,
        count: 1,
        successRate: m.success_count > 0 ? 100 : 0
      });
    }
    
    return acc;
  }, []);

  const totalRequests = metrics.reduce((sum, m) => sum + m.success_count + m.error_count, 0);
  const successCount = metrics.reduce((sum, m) => sum + m.success_count, 0);
  const totalResponseTime = metrics.reduce((sum, m) => sum + m.avg_response_time, 0);

  return {
    totalRequests,
    successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
    avgResponseTime: metrics.length > 0 ? totalResponseTime / metrics.length : 0,
    errorPatterns,
    timeDistribution: timeDistribution.sort((a, b) => a.hour - b.hour)
  };
}

export async function logMetrics(
  endpoint: string,
  success: boolean,
  responseTime: number,
  errorDetails?: { type: string; message: string }
) {
  console.log(`Logging metrics for ${endpoint}:`, {
    success,
    responseTime,
    errorDetails
  });

  try {
    const { error } = await supabase
      .from('api_health_metrics')
      .insert({
        endpoint,
        success_count: success ? 1 : 0,
        error_count: success ? 0 : 1,
        avg_response_time: responseTime,
        last_success_time: success ? new Date().toISOString() : null,
        last_error_time: success ? null : new Date().toISOString(),
        error_pattern: errorDetails ? {
          type: errorDetails.type,
          message: errorDetails.message,
          timestamp: new Date().toISOString()
        } : null
      });

    if (error) {
      console.error('Error logging metrics:', error);
      throw error;
    }

    console.log('Successfully logged metrics');
  } catch (error) {
    console.error('Failed to log metrics:', error);
    throw error;
  }
}