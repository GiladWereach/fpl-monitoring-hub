import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface MetricAggregationProps {
  metrics: any[];
  onAggregationChange: (config: AggregationConfig) => void;
}

interface AggregationConfig {
  type: string;
  window: number;
  baseline?: number;
}

export function MetricAggregation({ metrics, onAggregationChange }: MetricAggregationProps) {
  const [config, setConfig] = useState<AggregationConfig>({
    type: 'rolling',
    window: 24,
  });

  const handleChange = (updates: Partial<AggregationConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onAggregationChange(newConfig);
    
    toast({
      title: "Aggregation Updated",
      description: `Applied ${newConfig.type} aggregation with ${newConfig.window}h window`,
    });
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <Label>Aggregation Type</Label>
          <Select 
            value={config.type}
            onValueChange={(value) => handleChange({ type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rolling">Rolling Average</SelectItem>
              <SelectItem value="cumulative">Cumulative Sum</SelectItem>
              <SelectItem value="baseline">Baseline Comparison</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Time Window (hours)</Label>
          <Input 
            type="number"
            value={config.window}
            onChange={(e) => handleChange({ window: parseInt(e.target.value) })}
            min={1}
            max={168}
          />
        </div>

        {config.type === 'baseline' && (
          <div>
            <Label>Baseline Value</Label>
            <Input 
              type="number"
              value={config.baseline}
              onChange={(e) => handleChange({ baseline: parseInt(e.target.value) })}
            />
          </div>
        )}
      </div>
    </Card>
  );
}