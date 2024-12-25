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
        total_recovery_time: 0,
        error_categories: {},
        severity_counts: {}
      };
    }

    // Update basic metrics
    acc[hour].error_count++;
    if (error.retry_count !== null) {
      acc[hour].recovered_count++;
      acc[hour].total_recovery_time += error.retry_count * 60;
    }

    // Track error categories
    if (error.category) {
      acc[hour].error_categories[error.category] = 
        (acc[hour].error_categories[error.category] || 0) + 1;
    }

    // Track error severities
    if (error.severity) {
      acc[hour].severity_counts[error.severity] = 
        (acc[hour].severity_counts[error.severity] || 0) + 1;
    }

    return acc;
  }, {} as Record<string, HourlyMetrics>);

  // Convert to array format for chart
  return Object.entries(hourlyMetrics).map(([hour, metrics]) => ({
    timestamp: hour,
    error_count: metrics.error_count,
    recovery_rate: metrics.recovered_count / metrics.error_count * 100,
    avg_recovery_time: metrics.total_recovery_time / metrics.recovered_count || 0,
    error_severity: determineOverallSeverity(metrics.severity_counts),
    error_categories: metrics.error_categories
  }));
}

function determineOverallSeverity(
  severityCounts: Record<string, number>
): 'low' | 'medium' | 'high' | 'critical' {
  const total = Object.values(severityCounts).reduce((sum, count) => sum + count, 0);
  const criticalPercentage = (severityCounts['critical'] || 0) / total * 100;
  const highPercentage = (severityCounts['high'] || 0) / total * 100;

  if (criticalPercentage > 10) return 'critical';
  if (highPercentage > 20) return 'high';
  if (highPercentage > 5) return 'medium';
  return 'low';
}

export function analyzeErrorPatterns(metrics: ErrorMetrics[]): {
  severity: 'low' | 'medium' | 'high';
  trend: 'improving' | 'stable' | 'degrading';
  recommendations: string[];
} {
  console.log('Analyzing error patterns:', metrics);
  
  const recentMetrics = metrics.slice(-24); // Last 24 hours
  const totalErrors = recentMetrics.reduce((sum, m) => sum + m.error_count, 0);
  const avgRecoveryRate = recentMetrics.reduce((sum, m) => sum + m.recovery_rate, 0) / recentMetrics.length;
  
  // Determine severity
  const severity = 
    totalErrors > 100 || avgRecoveryRate < 50 ? 'high' :
    totalErrors > 50 || avgRecoveryRate < 75 ? 'medium' : 'low';
  
  // Analyze trend
  const firstHalf = recentMetrics.slice(0, 12);
  const secondHalf = recentMetrics.slice(12);
  const firstHalfErrors = firstHalf.reduce((sum, m) => sum + m.error_count, 0);
  const secondHalfErrors = secondHalf.reduce((sum, m) => sum + m.error_count, 0);
  
  const trend = 
    secondHalfErrors < firstHalfErrors * 0.8 ? 'improving' :
    secondHalfErrors > firstHalfErrors * 1.2 ? 'degrading' : 'stable';
  
  // Generate recommendations
  const recommendations = [];
  if (avgRecoveryRate < 75) {
    recommendations.push('Consider increasing retry attempts or adjusting retry intervals');
  }
  if (totalErrors > 50) {
    recommendations.push('Investigate common error patterns and implement preventive measures');
  }
  if (trend === 'degrading') {
    recommendations.push('System health is declining - immediate investigation recommended');
  }
  
  return { severity, trend, recommendations };
}