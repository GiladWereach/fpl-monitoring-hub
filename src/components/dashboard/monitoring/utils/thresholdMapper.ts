import { AlertThreshold } from "../types/error-analytics";

interface DatabaseThreshold {
  id: number;
  metric_name: string;
  warning_threshold: number;
  critical_threshold: number;
  enabled: boolean;
  notify_on_warning: boolean;
  notify_on_critical: boolean;
  created_at: string;
  updated_at: string;
}

export const mapDatabaseToAlertThresholds = (
  dbThresholds: DatabaseThreshold[]
): AlertThreshold[] => {
  console.log('Mapping database thresholds:', dbThresholds);
  
  return dbThresholds.map(threshold => ({
    metric: threshold.metric_name,
    warning: threshold.warning_threshold,
    critical: threshold.critical_threshold,
    currentValue: 0, // This should be updated with actual current value
    status: 'normal' as const // This should be calculated based on current value
  }));
};