import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Download, BarChart2, LineChart, PieChart } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface VisualizationControlsProps {
  onChartTypeChange: (type: string) => void;
  onExportData: () => void;
  onComparisonToggle: (enabled: boolean) => void;
}

export function VisualizationControls({
  onChartTypeChange,
  onExportData,
  onComparisonToggle
}: VisualizationControlsProps) {
  const [showComparison, setShowComparison] = useState(false);

  const handleComparisonToggle = (enabled: boolean) => {
    setShowComparison(enabled);
    onComparisonToggle(enabled);
    toast({
      title: enabled ? "Comparison Mode Enabled" : "Comparison Mode Disabled",
      description: enabled ? "You can now compare metrics across different time periods" : "Comparison mode has been turned off",
    });
  };

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select onValueChange={onChartTypeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select chart type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">
                <div className="flex items-center gap-2">
                  <LineChart className="h-4 w-4" />
                  <span>Line Chart</span>
                </div>
              </SelectItem>
              <SelectItem value="bar">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4" />
                  <span>Bar Chart</span>
                </div>
              </SelectItem>
              <SelectItem value="pie">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  <span>Pie Chart</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <span className="text-sm">Enable Comparison</span>
            <Switch
              checked={showComparison}
              onCheckedChange={handleComparisonToggle}
            />
          </div>
        </div>

        <Button variant="outline" onClick={onExportData}>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>
    </Card>
  );
}