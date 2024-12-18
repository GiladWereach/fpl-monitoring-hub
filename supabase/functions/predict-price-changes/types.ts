export interface PricePrediction {
  player_id: number;
  prediction_type: 'RISE' | 'FALL' | 'STABLE';
  probability: number;
  confidence_score: number;
  earliest_expected: Date;
  latest_expected: Date;
  factors: PredictionFactors;
}

export interface PredictionFactors {
  transfer_trend: {
    net_transfers: number;
    velocity: number;
    acceleration: number;
  };
  ownership_impact: {
    current_ownership: number;
    ownership_trend: number;
    threshold_distance: number;
  };
  timing_factors: {
    time_since_last_change: number;
    gameweek_position: number;
  };
}

export interface TransferTrend {
  net_transfers: number;
  velocity: number;
  acceleration: number;
}

export interface ValidationResult {
  was_correct: boolean;
  actual_change_time: Date;
  prediction_accuracy: number;
  timing_accuracy: number;
}