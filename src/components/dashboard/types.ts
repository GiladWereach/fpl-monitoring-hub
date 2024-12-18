export interface AccuracyMetrics {
  was_correct: boolean;
  timing_deviation?: number;
  confidence_correlation?: number;
}

export interface SystemMetrics {
  health_score: number;
  performance_indicators?: {
    response_time?: number;
    error_rate?: number;
  };
}

export interface PredictionValidation {
  id: number;
  prediction_id: number | null;
  actual_timestamp: string | null;
  predicted_timestamp: string | null;
  accuracy_metrics: AccuracyMetrics | null;
  system_metrics: SystemMetrics | null;
  created_at: string | null;
  price_predictions?: {
    prediction_type: string;
    probability: number;
    confidence_score: number;
  } | null;
}

export interface SystemAccuracy {
  id: number;
  period_start: string | null;
  period_end: string | null;
  period_type: string | null;
  metrics: SystemMetrics | null;
  created_at: string | null;
}