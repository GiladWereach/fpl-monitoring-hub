export interface ThresholdConfig {
  metricName: string;
  warningThreshold: number;
  criticalThreshold: number;
  enabled: boolean;
  notifyOnWarning: boolean;
  notifyOnCritical: boolean;
}

export interface ThresholdValidation {
  isValid: boolean;
  errors: string[];
}