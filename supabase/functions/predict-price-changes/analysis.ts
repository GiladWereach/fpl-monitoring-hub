import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { TransferTrend, PredictionFactors } from './types.ts';

export async function analyzeTrends(
  supabase: any,
  player_id: number,
  hours: number = 24
): Promise<TransferTrend> {
  const now = new Date();
  const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

  const { data: transfers, error } = await supabase
    .from('transfer_history')
    .select('*')
    .eq('player_id', player_id)
    .gte('timestamp', startTime.toISOString())
    .order('timestamp', { ascending: true });

  if (error) throw error;

  if (!transfers?.length) {
    return {
      net_transfers: 0,
      velocity: 0,
      acceleration: 0
    };
  }

  // Calculate net transfers
  const net_transfers = transfers.reduce(
    (acc, curr) => acc + (curr.transfers_in_delta - curr.transfers_out_delta),
    0
  );

  // Calculate velocity (transfers per hour)
  const timeSpan = (new Date(transfers[transfers.length - 1].timestamp).getTime() - 
                    new Date(transfers[0].timestamp).getTime()) / (1000 * 60 * 60);
  const velocity = net_transfers / timeSpan;

  // Calculate acceleration (change in velocity)
  const midPoint = Math.floor(transfers.length / 2);
  const firstHalf = transfers.slice(0, midPoint);
  const secondHalf = transfers.slice(midPoint);

  const firstHalfVelocity = calculateVelocity(firstHalf);
  const secondHalfVelocity = calculateVelocity(secondHalf);
  const acceleration = (secondHalfVelocity - firstHalfVelocity) / (timeSpan / 2);

  return {
    net_transfers,
    velocity,
    acceleration
  };
}

function calculateVelocity(transfers: any[]): number {
  if (transfers.length < 2) return 0;
  
  const netTransfers = transfers.reduce(
    (acc, curr) => acc + (curr.transfers_in_delta - curr.transfers_out_delta),
    0
  );
  
  const timeSpan = (new Date(transfers[transfers.length - 1].timestamp).getTime() - 
                    new Date(transfers[0].timestamp).getTime()) / (1000 * 60 * 60);
  
  return netTransfers / timeSpan;
}

export function calculateConfidence(factors: PredictionFactors): number {
  const weights = {
    transfer_trend: 0.4,
    ownership_impact: 0.3,
    timing_factors: 0.3
  };

  const transferScore = calculateTransferScore(factors.transfer_trend);
  const ownershipScore = calculateOwnershipScore(factors.ownership_impact);
  const timingScore = calculateTimingScore(factors.timing_factors);

  const weightedScore = 
    transferScore * weights.transfer_trend +
    ownershipScore * weights.ownership_impact +
    timingScore * weights.timing_factors;

  // Convert to 1-5 scale
  return Math.max(1, Math.min(5, Math.round(weightedScore * 5)));
}

function calculateTransferScore(trend: PredictionFactors['transfer_trend']): number {
  const velocityImpact = Math.min(1, Math.abs(trend.velocity) / 1000);
  const accelerationImpact = Math.min(1, Math.abs(trend.acceleration) / 100);
  return (velocityImpact * 0.7 + accelerationImpact * 0.3);
}

function calculateOwnershipScore(impact: PredictionFactors['ownership_impact']): number {
  const ownershipImpact = Math.min(1, impact.current_ownership / 50);
  const trendImpact = Math.min(1, Math.abs(impact.ownership_trend) / 5);
  return (ownershipImpact * 0.4 + trendImpact * 0.6);
}

function calculateTimingScore(timing: PredictionFactors['timing_factors']): number {
  const timeScore = Math.min(1, timing.time_since_last_change / (24 * 7));
  const gameweekScore = Math.min(1, timing.gameweek_position / 38);
  return (timeScore * 0.6 + gameweekScore * 0.4);
}