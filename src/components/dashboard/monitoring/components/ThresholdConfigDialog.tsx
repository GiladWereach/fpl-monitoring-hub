import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { ThresholdConfig } from "../types/threshold-config";
import { toast } from "@/hooks/use-toast";

interface ThresholdConfigDialogProps {
  currentConfig: ThresholdConfig;
  onSave: (config: ThresholdConfig) => void;
}

export function ThresholdConfigDialog({ currentConfig, onSave }: ThresholdConfigDialogProps) {
  console.log('Rendering ThresholdConfigDialog with:', currentConfig);
  const [config, setConfig] = useState<ThresholdConfig>(currentConfig);

  const handleSave = () => {
    if (config.warningThreshold >= config.criticalThreshold) {
      toast({
        title: "Invalid Thresholds",
        description: "Warning threshold must be lower than critical threshold",
        variant: "destructive",
      });
      return;
    }

    onSave(config);
    toast({
      title: "Configuration Saved",
      description: "Threshold settings have been updated",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configure
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Thresholds: {config.metricName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Warning Threshold</label>
            <Input
              type="number"
              value={config.warningThreshold}
              onChange={(e) => setConfig({
                ...config,
                warningThreshold: parseFloat(e.target.value)
              })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Critical Threshold</label>
            <Input
              type="number"
              value={config.criticalThreshold}
              onChange={(e) => setConfig({
                ...config,
                criticalThreshold: parseFloat(e.target.value)
              })}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Enable Monitoring</label>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig({
                ...config,
                enabled: checked
              })}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Warning Notifications</label>
            <Switch
              checked={config.notifyOnWarning}
              onCheckedChange={(checked) => setConfig({
                ...config,
                notifyOnWarning: checked
              })}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Critical Notifications</label>
            <Switch
              checked={config.notifyOnCritical}
              onCheckedChange={(checked) => setConfig({
                ...config,
                notifyOnCritical: checked
              })}
            />
          </div>
          <Button className="w-full" onClick={handleSave}>
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}