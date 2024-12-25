export interface ErrorMetrics {
  timestamp: string;
  error_count: number;
  recovery_rate: number;
  avg_recovery_time?: number;
  error_severity?: 'low' | 'medium' | 'high' | 'critical';
  error_categories?: Record<string, number>;
}

export interface RawErrorLog {
  created_at: string;
  retry_count: number | null;
  error_type: string;
  error_details: string | null;
  severity?: string;
  category?: string;
}

export interface HourlyMetrics {
  error_count: number;
  recovered_count: number;
  total_recovery_time: number;
  error_categories: Record<string, number>;
  severity_counts: Record<string, number>;
}

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  resourceUtilization: number;
}

export interface AlertThreshold {
  metric: string;
  warning: number;
  critical: number;
  currentValue: number;
  status: 'normal' | 'warning' | 'critical';
}