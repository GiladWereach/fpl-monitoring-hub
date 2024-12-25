export interface ErrorMetrics {
  timestamp: string;
  error_count: number;
  recovery_rate: number;
  avg_recovery_time?: number;
}

export interface RawErrorLog {
  created_at: string;
  retry_count: number | null;
  error_type: string;
  error_details: string | null;
}

export interface HourlyMetrics {
  error_count: number;
  recovered_count: number;
  total_recovery_time: number;
}