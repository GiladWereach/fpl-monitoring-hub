import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ProcessingMetrics } from "@/types/metrics";

export function ProcessingValidation() {
  const { data: processingMetrics } = useQuery<ProcessingMetrics>({
    queryKey: ['processing-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_processing_metrics', {
          hours_ago: 24
        });
      
      if (error) throw error;
      return data[0];
    }
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Processing Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-background/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Processing Time</p>
            <p className="text-2xl font-bold">{processingMetrics?.avg_processing_time || 0}ms</p>
          </div>
          <div className="p-4 bg-background/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Error Rate</p>
            <p className="text-2xl font-bold">{processingMetrics?.error_rate || 0}%</p>
          </div>
          <div className="p-4 bg-background/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Data Quality</p>
            <p className="text-2xl font-bold">{processingMetrics?.data_quality_score || 0}%</p>
          </div>
        </div>
      </Card>
    </div>
  );
}