import { PredictionResult } from "@/components/backend/scheduler/utils/resourcePredictor";

export interface MetricsData {
  endpoint: string;
  total_successes: number;
  total_errors: number;
  avg_response_time: number;
  success_rate: number;
  latest_success: string | null;
  latest_error: string | null;
  health_status: string;
  predictedUsage?: PredictionResult;
}