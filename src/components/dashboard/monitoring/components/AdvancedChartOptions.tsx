import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart, AreaChart, Activity } from "lucide-react";

interface AdvancedChartOptionsProps {
  onChartTypeChange: (type: string) => void;
  onTimeRangeChange: (range: { from: Date; to: Date }) => void;
  onComparisonToggle: (enabled: boolean) => void;
  onAggregationChange: (type: string) => void;
}

export function AdvancedChartOptions({
  onChartTypeChange,
  onTimeRangeChange,
  onComparisonToggle,
  onAggregationChange
}: AdvancedChartOptionsProps) {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Label>Chart Type</Label>
          <Select onValueChange={onChartTypeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select visualization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">
                <div className="flex items-center gap-2">
                  <LineChart className="h-4 w-4" />
                  <span>Line Chart</span>
                </div>
              </SelectItem>
              <SelectItem value="area">
                <div className="flex items-center gap-2">
                  <AreaChart className="h-4 w-4" />
                  <span>Area Chart</span>
                </div>
              </SelectItem>
              <SelectItem value="bar">
                <div className="flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  <span>Bar Chart</span>
                </div>
              </SelectItem>
              <SelectItem value="stacked">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Stacked Chart</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Time Range</Label>
          <DateRangePicker onUpdate={onTimeRangeChange} />
        </div>

        <div className="space-y-2">
          <Label>Aggregation</Label>
          <Select onValueChange={onAggregationChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select aggregation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="avg">Average</SelectItem>
              <SelectItem value="sum">Sum</SelectItem>
              <SelectItem value="min">Minimum</SelectItem>
              <SelectItem value="max">Maximum</SelectItem>
              <SelectItem value="median">Median</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Switch onCheckedChange={onComparisonToggle} />
          <Label>Enable Comparison</Label>
        </div>
      </div>
    </Card>
  );
}