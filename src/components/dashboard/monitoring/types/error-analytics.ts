export interface ErrorMetrics {
  timestamp: string;
  error_count: number;
  recovery_rate: number;
  avg_recovery_time?: number; // Made optional since it's not always available
}