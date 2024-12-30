import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AlertConfigurationProps {
  metricName: string;
  currentConfig?: ThresholdConfig;
}

interface ThresholdConfig {
  warning: number;
  critical: number;
  enabled: boolean;
  timeWindow: number;
  notifyOnRecovery: boolean;
}

export function AlertConfiguration({ metricName, currentConfig }: AlertConfigurationProps) {
  const [config, setConfig] = useState<ThresholdConfig>(currentConfig || {
    warning: 80,
    critical: 90,
    enabled: true,
    timeWindow: 15,
    notifyOnRecovery: true
  });

  const saveConfiguration = async () => {
    try {
      const { error } = await supabase
        .from('monitoring_thresholds')
        .upsert({
          metric_name: metricName,
          warning_threshold: config.warning,
          critical_threshold: config.critical,
          enabled: config.enabled,
          time_window: config.timeWindow,
          notify_on_recovery: config.notifyOnRecovery,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Configuration Saved",
        description: "Alert thresholds have been updated successfully",
      });
    } catch (error) {
      console.error('Error saving thresholds:', error);
      toast({
        title: "Error",
        description: "Failed to save alert configuration",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <Label>Warning Threshold (%)</Label>
          <Input 
            type="number"
            value={config.warning}
            onChange={(e) => setConfig({ ...config, warning: parseInt(e.target.value) })}
            min={0}
            max={100}
          />
        </div>

        <div>
          <Label>Critical Threshold (%)</Label>
          <Input 
            type="number"
            value={config.critical}
            onChange={(e) => setConfig({ ...config, critical: parseInt(e.target.value) })}
            min={0}
            max={100}
          />
        </div>

        <div>
          <Label>Time Window (minutes)</Label>
          <Input 
            type="number"
            value={config.timeWindow}
            onChange={(e) => setConfig({ ...config, timeWindow: parseInt(e.target.value) })}
            min={1}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Enable Alerts</Label>
          <Switch 
            checked={config.enabled}
            onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Notify on Recovery</Label>
          <Switch 
            checked={config.notifyOnRecovery}
            onCheckedChange={(checked) => setConfig({ ...config, notifyOnRecovery: checked })}
          />
        </div>

        <Button onClick={saveConfiguration} className="w-full">
          Save Configuration
        </Button>
      </div>
    </Card>
  );
}