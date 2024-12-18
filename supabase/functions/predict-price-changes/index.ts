import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { analyzeTrends, calculateConfidence } from './analysis.ts';
import { PricePrediction, PredictionFactors } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting price change predictions...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get active players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('removed', false);

    if (playersError) throw playersError;

    const predictions: PricePrediction[] = [];
    
    // Process each player
    for (const player of players) {
      try {
        const transferTrend = await analyzeTrends(supabase, player.id);
        
        // Get last price change
        const { data: lastChange } = await supabase
          .from('price_changes')
          .select('*')
          .eq('player_id', player.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        const factors: PredictionFactors = {
          transfer_trend: transferTrend,
          ownership_impact: {
            current_ownership: parseFloat(player.selected_by_percent),
            ownership_trend: 0, // Calculate from historical data
            threshold_distance: 0 // Calculate based on price change thresholds
          },
          timing_factors: {
            time_since_last_change: lastChange ? 
              (Date.now() - new Date(lastChange.timestamp).getTime()) / (1000 * 60 * 60) : 
              168, // 1 week in hours
            gameweek_position: 0 // Calculate based on current gameweek
          }
        };

        const prediction_type = determinePredictionType(transferTrend);
        const probability = calculateProbability(factors);
        const confidence_score = calculateConfidence(factors);
        
        const timeframe = calculateTimeframe(factors);

        predictions.push({
          player_id: player.id,
          prediction_type,
          probability,
          confidence_score,
          earliest_expected: timeframe.earliest,
          latest_expected: timeframe.latest,
          factors
        });
      } catch (error) {
        console.error(`Error processing player ${player.id}:`, error);
      }
    }

    // Store predictions
    if (predictions.length > 0) {
      const { error: insertError } = await supabase
        .from('price_predictions')
        .insert(predictions.map(prediction => ({
          player_id: prediction.player_id,
          prediction_type: prediction.prediction_type,
          probability: prediction.probability,
          confidence_score: prediction.confidence_score,
          earliest_expected: prediction.earliest_expected,
          latest_expected: prediction.latest_expected,
          factors: prediction.factors
        })));

      if (insertError) throw insertError;
    }

    // Log calculation completion
    await supabase
      .from('calculation_logs')
      .insert({
        calculation_type_id: 4, // Price Change Prediction
        status: 'completed',
        affected_rows: predictions.length,
        performance_metrics: {
          processed_players: players.length,
          generated_predictions: predictions.length
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        predictions_count: predictions.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in price predictions:', error);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase
      .from('calculation_logs')
      .insert({
        calculation_type_id: 4,
        status: 'error',
        error_message: error.message
      });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to generate price predictions'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function determinePredictionType(trend: PredictionFactors['transfer_trend']): PricePrediction['prediction_type'] {
  if (Math.abs(trend.velocity) < 50) return 'STABLE';
  return trend.velocity > 0 ? 'RISE' : 'FALL';
}

function calculateProbability(factors: PredictionFactors): number {
  const velocityFactor = Math.min(1, Math.abs(factors.transfer_trend.velocity) / 1000);
  const ownershipFactor = Math.min(1, factors.ownership_impact.current_ownership / 50);
  const timeFactor = Math.min(1, factors.timing_factors.time_since_last_change / (24 * 7));

  return Math.min(100, Math.round(
    (velocityFactor * 0.5 + ownershipFactor * 0.3 + timeFactor * 0.2) * 100
  ));
}

function calculateTimeframe(factors: PredictionFactors): { earliest: Date; latest: Date } {
  const now = new Date();
  const velocity = Math.abs(factors.transfer_trend.velocity);
  
  // Base hours until change
  let baseHours = velocity > 200 ? 6 : 
                  velocity > 100 ? 12 : 
                  velocity > 50 ? 24 : 48;

  // Adjust based on ownership
  if (factors.ownership_impact.current_ownership > 30) {
    baseHours *= 0.8;
  }

  return {
    earliest: new Date(now.getTime() + (baseHours * 0.8) * 60 * 60 * 1000),
    latest: new Date(now.getTime() + (baseHours * 1.2) * 60 * 60 * 1000)
  };
}