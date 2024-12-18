export interface CollectionMetrics {
  total_records: number;
  collection_rate: number;
  success_rate: number;
}

export interface ProcessingMetrics {
  avg_processing_time: number;
  error_rate: number;
  data_quality_score: number;
}

export interface SystemHealthMetrics {
  health_score: number;
  performance_indicators?: {
    response_time?: number;
    error_rate?: number;
    uptime?: number;
  };
}