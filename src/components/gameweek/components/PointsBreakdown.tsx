import React from 'react';

interface PointsBreakdownProps {
  liveData?: any;
  pointsCalculation?: any;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

export function PointsBreakdown({ liveData, pointsCalculation, isCaptain, isViceCaptain }: PointsBreakdownProps) {
  if (!pointsCalculation && !liveData?.points_breakdown) return null;

  // Use points calculation data if available, otherwise fallback to live data
  const breakdown = {
    minutes: pointsCalculation?.minutes_points || liveData?.points_breakdown?.minutes || 0,
    goals: pointsCalculation?.goals_scored_points || liveData?.points_breakdown?.goals || 0,
    assists: pointsCalculation?.assist_points || liveData?.points_breakdown?.assists || 0,
    cleanSheets: pointsCalculation?.clean_sheet_points || liveData?.points_breakdown?.clean_sheets || 0,
    saves: pointsCalculation?.saves_points || liveData?.points_breakdown?.saves || 0,
    penalties_saved: pointsCalculation?.penalty_save_points || liveData?.points_breakdown?.penalties_saved || 0,
    penalties_missed: pointsCalculation?.penalty_miss_points || liveData?.points_breakdown?.penalties_missed || 0,
    yellow_cards: pointsCalculation?.card_points || liveData?.points_breakdown?.yellow_cards || 0,
    red_cards: pointsCalculation?.card_points || liveData?.points_breakdown?.red_cards || 0,
    own_goals: pointsCalculation?.own_goal_points || liveData?.points_breakdown?.own_goals || 0,
    bonus: liveData?.bonus || 0,
    bps: liveData?.bps || 0
  };

  return (
    <div className="space-y-2">
      {/* Points Breakdown Section */}
      {liveData?.minutes > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-foreground/80">Minutes</span>
          <span className="text-xs font-medium text-foreground">
            {liveData.minutes}' (+{breakdown.minutes})
          </span>
        </div>
      )}
      {breakdown.goals > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-foreground/80">Goals</span>
          <span className="text-xs font-medium text-foreground">
            {pointsCalculation?.goals_scored || liveData?.goals_scored || 0} (+{breakdown.goals})
          </span>
        </div>
      )}
      {breakdown.assists > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-foreground/80">Assists</span>
          <span className="text-xs font-medium text-foreground">
            {pointsCalculation?.assists || liveData?.assists || 0} (+{breakdown.assists})
          </span>
        </div>
      )}
      {breakdown.cleanSheets > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-foreground/80">Clean Sheet</span>
          <span className="text-xs font-medium text-foreground">
            ✓ (+{breakdown.cleanSheets})
          </span>
        </div>
      )}
      {breakdown.saves > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-foreground/80">Saves</span>
          <span className="text-xs font-medium text-foreground">
            {pointsCalculation?.saves || liveData?.saves || 0} (+{breakdown.saves})
          </span>
        </div>
      )}
      {breakdown.penalties_saved > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-foreground/80">Penalties Saved</span>
          <span className="text-xs font-medium text-foreground">
            {pointsCalculation?.penalties_saved || liveData?.penalties_saved || 0} (+{breakdown.penalties_saved})
          </span>
        </div>
      )}
      {breakdown.penalties_missed < 0 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-foreground/80">Penalties Missed</span>
          <span className="text-xs font-medium text-foreground">
            {pointsCalculation?.penalties_missed || liveData?.penalties_missed || 0} ({breakdown.penalties_missed})
          </span>
        </div>
      )}
      {breakdown.yellow_cards < 0 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-foreground/80">Yellow Cards</span>
          <span className="text-xs font-medium text-foreground">
            {pointsCalculation?.yellow_cards || liveData?.yellow_cards || 0} ({breakdown.yellow_cards})
          </span>
        </div>
      )}
      {breakdown.red_cards < 0 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-foreground/80">Red Cards</span>
          <span className="text-xs font-medium text-foreground">
            {pointsCalculation?.red_cards || liveData?.red_cards || 0} ({breakdown.red_cards})
          </span>
        </div>
      )}
      {breakdown.own_goals < 0 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-foreground/80">Own Goals</span>
          <span className="text-xs font-medium text-foreground">
            {pointsCalculation?.own_goals || liveData?.own_goals || 0} ({breakdown.own_goals})
          </span>
        </div>
      )}
      {breakdown.bonus > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-foreground/80">Bonus</span>
          <span className="text-xs font-medium text-foreground">
            +{breakdown.bonus}
          </span>
        </div>
      )}
      {breakdown.bps > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-foreground/80">BPS</span>
          <span className="text-xs font-medium text-foreground">
            {breakdown.bps}
          </span>
        </div>
      )}
      
      {/* Captain/Vice Captain Section */}
      {(isCaptain || isViceCaptain) && (
        <div className="mt-2 pt-2 border-t border-accent/20">
          <span className="text-xs font-medium text-accent">
            {isCaptain ? 'Captain (2x points)' : 'Vice Captain'}
          </span>
        </div>
      )}
    </div>
  );
}