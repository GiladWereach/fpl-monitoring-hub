import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AlertThreshold {
  metric: string;
  warning: number;
  critical: number;
}

export function AlertThresholdConfig() {
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([
    { metric: "error_rate", warning: 5, critical: 10 },
    { metric: "response_time", warning: 1000, critical: 2000 }
  ]);

  const saveThresholds = async () => {
    try {
      const { error } = await supabase
        .from('monitoring_thresholds')
        .upsert(
          thresholds.map(t => ({
            metric_name: t.metric,
            warning_threshold: t.warning,
            critical_threshold: t.critical,
            enabled: true
          }))
        );

      if (error) throw error;

      toast({
        title: "Thresholds Updated",
        description: "Alert thresholds have been saved successfully",
      });
    } catch (error) {
      console.error('Error saving thresholds:', error);
      toast({
        title: "Error",
        description: "Failed to save alert thresholds",
        variant: "destructive",
      });
    }
  };

  const handleThresholdChange = (
    index: number,
    field: 'warning' | 'critical',
    value: string
  ) => {
    const newThresholds = [...thresholds];
    newThresholds[index] = {
      ...newThresholds[index],
      [field]: parseFloat(value) || 0
    };
    setThresholds(newThresholds);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">Alert Thresholds</h3>
      </div>

      <div className="space-y-4">
        {thresholds.map((threshold, index) => (
          <div key={threshold.metric} className="grid grid-cols-3 gap-4">
            <div className="font-medium capitalize">
              {threshold.metric.replace('_', ' ')}
            </div>
            <Input
              type="number"
              value={threshold.warning}
              onChange={(e) => handleThresholdChange(index, 'warning', e.target.value)}
              placeholder="Warning threshold"
            />
            <Input
              type="number"
              value={threshold.critical}
              onChange={(e) => handleThresholdChange(index, 'critical', e.target.value)}
              placeholder="Critical threshold"
            />
          </div>
        ))}
      </div>

      <Button onClick={saveThresholds} className="mt-4">
        Save Thresholds
      </Button>
    </Card>
  );
}