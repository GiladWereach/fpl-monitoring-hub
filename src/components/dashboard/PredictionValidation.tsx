import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { PredictionValidation as PredictionValidationType, SystemAccuracy } from "./types";
import { Database } from "@/integrations/supabase/types";

interface ValidationMetrics {
  total_predictions: number;
  correct_predictions: number;
  accuracy_rate: number;
  avg_time_deviation: number;
  confidence_correlation: number;
}

export function PredictionValidation() {
  const { data: validations } = useQuery({
    queryKey: ['prediction-validations'],
    queryFn: async () => {
      console.log('Fetching prediction validations');
      const { data, error } = await supabase
        .from('prediction_validations')
        .select(`
          *,
          price_predictions (
            prediction_type,
            probability,
            confidence_score
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching validations:', error);
        throw error;
      }

      console.log('Fetched validations:', data);
      return (data as any[]).map(validation => ({
        ...validation,
        accuracy_metrics: validation.accuracy_metrics as PredictionValidationType['accuracy_metrics'],
        system_metrics: validation.system_metrics as PredictionValidationType['system_metrics']
      })) as PredictionValidationType[];
    },
    refetchInterval: 60000
  });

  const { data: systemAccuracy } = useQuery({
    queryKey: ['system-accuracy'],
    queryFn: async () => {
      console.log('Fetching system accuracy metrics');
      const { data, error } = await supabase
        .from('system_accuracy')
        .select('*')
        .order('period_start', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching system accuracy:', error);
        throw error;
      }

      console.log('System accuracy:', data);
      if (!data) return null;
      
      const metrics = data.metrics as { health_score: number; performance_indicators?: { response_time?: number; error_rate?: number; } };
      
      return {
        ...data,
        metrics: {
          health_score: metrics.health_score,
          performance_indicators: metrics.performance_indicators
        }
      } as SystemAccuracy;
    },
    refetchInterval: 300000
  });

  const calculateMetrics = (validations: PredictionValidationType[]): ValidationMetrics => {
    if (!validations?.length) {
      return {
        total_predictions: 0,
        correct_predictions: 0,
        accuracy_rate: 0,
        avg_time_deviation: 0,
        confidence_correlation: 0
      };
    }

    const correct = validations.filter(v => v.accuracy_metrics?.was_correct).length;
    const timeDeviations = validations
      .map(v => v.actual_timestamp && v.predicted_timestamp ? 
        Math.abs(new Date(v.actual_timestamp).getTime() - new Date(v.predicted_timestamp).getTime()) : 
        null)
      .filter((dev): dev is number => dev !== null);

    const avgDeviation = timeDeviations.length 
      ? timeDeviations.reduce((a, b) => a + b, 0) / timeDeviations.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Calculate correlation between confidence scores and correctness
    const confidenceScores = validations.map(v => ({
      confidence: v.price_predictions?.confidence_score || 0,
      correct: v.accuracy_metrics?.was_correct ? 1 : 0
    }));

    let correlation = 0;
    if (confidenceScores.length > 1) {
      const { confidenceAvg, correctAvg } = confidenceScores.reduce(
        (acc, curr) => ({
          confidenceAvg: acc.confidenceAvg + curr.confidence / confidenceScores.length,
          correctAvg: acc.correctAvg + curr.correct / confidenceScores.length
        }),
        { confidenceAvg: 0, correctAvg: 0 }
      );

      const numerator = confidenceScores.reduce(
        (sum, { confidence, correct }) =>
          sum + (confidence - confidenceAvg) * (correct - correctAvg),
        0
      );

      const denominator = Math.sqrt(
        confidenceScores.reduce((sum, { confidence }) => 
          sum + Math.pow(confidence - confidenceAvg, 2), 0
        ) *
        confidenceScores.reduce((sum, { correct }) => 
          sum + Math.pow(correct - correctAvg, 2), 0
        )
      );

      correlation = denominator === 0 ? 0 : numerator / denominator;
    }

    return {
      total_predictions: validations.length,
      correct_predictions: correct,
      accuracy_rate: (correct / validations.length) * 100,
      avg_time_deviation: avgDeviation,
      confidence_correlation: correlation
    };
  };

  const metrics = calculateMetrics(validations || []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Accuracy Rate</h3>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{metrics.accuracy_rate.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground mt-1">
            {metrics.correct_predictions} of {metrics.total_predictions} correct
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Time Deviation</h3>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{metrics.avg_time_deviation.toFixed(1)}h</p>
          <p className="text-sm text-muted-foreground mt-1">
            Average prediction offset
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Confidence Score</h3>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold mt-2">
            {(metrics.confidence_correlation * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Correlation with accuracy
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">System Health</h3>
            <div className={`h-2 w-2 rounded-full ${
              metrics.accuracy_rate > 80 ? 'bg-green-500' :
              metrics.accuracy_rate > 60 ? 'bg-yellow-500' :
              'bg-red-500'
            }`} />
          </div>
          <p className="text-2xl font-bold mt-2">
            {systemAccuracy?.metrics?.health_score || 'N/A'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Last updated: {systemAccuracy?.created_at ? 
              format(new Date(systemAccuracy.created_at), 'MMM d, HH:mm') : 
              'Never'}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Validations</h3>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {validations?.map((validation) => (
              <div
                key={validation.id}
                className="flex items-center justify-between p-4 bg-background/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-2 w-2 rounded-full ${
                    validation.accuracy_metrics?.was_correct ? 
                    'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium">
                      {validation.price_predictions?.prediction_type} Prediction
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Confidence: {validation.price_predictions?.confidence_score}/5
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="font-medium">
                      {validation.actual_timestamp ? 
                        format(new Date(validation.actual_timestamp), 'MMM d, HH:mm') :
                        'Pending'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Actual time
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {validation.predicted_timestamp ?
                        format(new Date(validation.predicted_timestamp), 'MMM d, HH:mm') :
                        'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Predicted time
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}