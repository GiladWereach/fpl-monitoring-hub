import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { PredictionValidation as PredictionValidationType, SystemAccuracy } from "./types";
import { MetricsCard } from "./validation/MetricsCard";
import { ValidationsList } from "./validation/ValidationsList";

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
        .maybeSingle();

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
        <MetricsCard
          title="Accuracy Rate"
          value={`${metrics.accuracy_rate.toFixed(1)}%`}
          subtitle={`${metrics.correct_predictions} of ${metrics.total_predictions} correct`}
          icon={CheckCircle2}
          iconColor="text-green-500"
        />
        
        <MetricsCard
          title="Time Deviation"
          value={`${metrics.avg_time_deviation.toFixed(1)}h`}
          subtitle="Average prediction offset"
          icon={Clock}
          iconColor="text-blue-500"
        />
        
        <MetricsCard
          title="Confidence Score"
          value={`${(metrics.confidence_correlation * 100).toFixed(1)}%`}
          subtitle="Correlation with accuracy"
          icon={AlertTriangle}
          iconColor="text-yellow-500"
        />
        
        <MetricsCard
          title="System Health"
          value={systemAccuracy?.metrics?.health_score?.toString() || 'N/A'}
          subtitle={`Last updated: ${systemAccuracy?.created_at ? 
            format(new Date(systemAccuracy.created_at), 'MMM d, HH:mm') : 
            'Never'}`}
          icon={AlertTriangle}
          iconColor="text-yellow-500"
          indicator={{
            color: metrics.accuracy_rate > 80 ? 'bg-green-500' :
                   metrics.accuracy_rate > 60 ? 'bg-yellow-500' :
                   'bg-red-500'
          }}
        />
      </div>

      <ValidationsList validations={validations || []} />
    </div>
  );
}
