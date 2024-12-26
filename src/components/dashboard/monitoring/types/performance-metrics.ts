export interface PerformanceMetrics {
  avg_processing_time: number;
  error_rate: number;
  data_quality_score: number;
  active_processes?: number;
  system_load?: number;
}