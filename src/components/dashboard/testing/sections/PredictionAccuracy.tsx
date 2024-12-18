import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

export function PredictionAccuracy() {
  const { data: accuracyMetrics } = useQuery({
    queryKey: ['prediction-accuracy'],
    queryFn: async () => {
      console.log('Fetching prediction accuracy metrics...');
      const { data, error } = await supabase
        .from('price_predictions')
        .select(`
          prediction_type,
          probability,
          confidence_score,
          was_correct,
          created_at,
          validated_at,
          players (
            web_name
          )
        `)
        .not('validated_at', 'is', null)
        .gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const calculateMetrics = () => {
    if (!accuracyMetrics?.length) return null;

    const metrics = accuracyMetrics.reduce((acc: any, curr) => {
      const type = curr.prediction_type;
      if (!acc[type]) {
        acc[type] = {
          total: 0,
          correct: 0,
          confidence_sum: 0
        };
      }
      acc[type].total++;
      if (curr.was_correct) acc[type].correct++;
      acc[type].confidence_sum += curr.confidence_score;
      return acc;
    }, {});

    return Object.entries(metrics).map(([type, data]: [string, any]) => ({
      type,
      accuracy: (data.correct / data.total) * 100,
      avg_confidence: data.confidence_sum / data.total,
      total_predictions: data.total
    }));
  };

  const metrics = calculateMetrics();

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Prediction Accuracy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics?.map((metric) => (
            <div key={metric.type} className="p-4 bg-background/50 rounded-lg">
              <p className="font-medium">{metric.type}</p>
              <div className="mt-2 space-y-1">
                <p className="text-sm">
                  Accuracy: {metric.accuracy.toFixed(1)}%
                </p>
                <p className="text-sm">
                  Avg Confidence: {metric.avg_confidence.toFixed(1)}/5
                </p>
                <p className="text-sm text-muted-foreground">
                  Based on {metric.total_predictions} predictions
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}