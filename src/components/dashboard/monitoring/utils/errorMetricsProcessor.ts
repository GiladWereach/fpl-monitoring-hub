import { ErrorMetrics, RawErrorLog, HourlyMetrics } from '../types/error-analytics';

export function processErrorMetrics(rawMetrics: RawErrorLog[]): ErrorMetrics[] {
  console.log('Processing error metrics:', rawMetrics);
  
  // Group errors by hour
  const hourlyMetrics = rawMetrics.reduce((acc, error) => {
    const hour = new Date(error.created_at).toISOString().slice(0, 13);
    if (!acc[hour]) {
      acc[hour] = {
        error_count: 0,
        recovered_count: 0,
        total_recovery_time: 0
      };
    }
    acc[hour].error_count++;
    
    // Calculate recovery metrics if available
    if (error.retry_count !== null) {
      acc[hour].recovered_count++;
      acc[hour].total_recovery_time += error.retry_count * 60; // Assuming 60s between retries
    }
    return acc;
  }, {} as Record<string, HourlyMetrics>);

  // Convert to array format for chart
  return Object.entries(hourlyMetrics).map(([hour, metrics]) => ({
    timestamp: hour,
    error_count: metrics.error_count,
    recovery_rate: metrics.recovered_count / metrics.error_count * 100,
    avg_recovery_time: metrics.total_recovery_time / metrics.recovered_count || 0
  }));
}