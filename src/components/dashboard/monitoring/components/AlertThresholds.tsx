import React from 'react';
import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { AlertThreshold } from '../types/error-analytics';

interface AlertThresholdsProps {
  thresholds: AlertThreshold[];
}

export function AlertThresholds({ thresholds }: AlertThresholdsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Alert Thresholds</h3>
      <div className="space-y-4">
        {thresholds.map((threshold, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(threshold.status)}
              <span className="font-medium">{threshold.metric}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Current: {threshold.currentValue}
              </span>
              <span className="text-sm text-yellow-500">
                Warning: {threshold.warning}
              </span>
              <span className="text-sm text-destructive">
                Critical: {threshold.critical}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}