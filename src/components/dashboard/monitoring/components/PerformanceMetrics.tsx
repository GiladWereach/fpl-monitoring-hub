import React from 'react';
import { Card } from "@/components/ui/card";
import { Activity, Clock, AlertTriangle, Server } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { PerformanceMetrics as PerformanceMetricsType } from '../types/error-analytics';

interface PerformanceMetricsProps {
  metrics: PerformanceMetricsType;
}

export function PerformanceMetrics({ metrics }: PerformanceMetricsProps) {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Response Time"
          value={`${metrics.responseTime}ms`}
          subtitle="Average"
          icon={Clock}
          iconColor="text-blue-500"
        />
        <MetricCard
          title="Throughput"
          value={`${metrics.throughput}/s`}
          subtitle="Requests per second"
          icon={Activity}
          iconColor="text-green-500"
        />
        <MetricCard
          title="Error Rate"
          value={`${metrics.errorRate}%`}
          subtitle="Last hour"
          icon={AlertTriangle}
          iconColor="text-destructive"
        />
        <MetricCard
          title="Resource Usage"
          value={`${metrics.resourceUtilization}%`}
          subtitle="CPU/Memory"
          icon={Server}
          iconColor="text-purple-500"
        />
      </div>
    </Card>
  );
}