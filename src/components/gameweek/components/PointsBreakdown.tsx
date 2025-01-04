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

  const renderBreakdownItem = (label: string, value: number, points: number) => {
    if (value === 0 && points === 0) return null;
    return (
      <div className="flex justify-between items-center">
        <span className="text-xs text-foreground/80">{label}</span>
        <span className="text-xs font-medium text-foreground">
          {value !== points ? `${value} (+${points})` : `+${points}`}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Minutes */}
      {liveData?.minutes > 0 && renderBreakdownItem('Minutes', liveData.minutes, breakdown.minutes)}
      
      {/* Goals */}
      {breakdown.goals > 0 && renderBreakdownItem('Goals', 
        pointsCalculation?.goals_scored || liveData?.goals_scored || 0, 
        breakdown.goals)}
      
      {/* Assists */}
      {breakdown.assists > 0 && renderBreakdownItem('Assists', 
        pointsCalculation?.assists || liveData?.assists || 0, 
        breakdown.assists)}
      
      {/* Clean Sheets */}
      {breakdown.cleanSheets > 0 && renderBreakdownItem('Clean Sheet', 1, breakdown.cleanSheets)}
      
      {/* Saves */}
      {breakdown.saves > 0 && renderBreakdownItem('Saves', 
        pointsCalculation?.saves || liveData?.saves || 0, 
        breakdown.saves)}
      
      {/* Penalties Saved */}
      {breakdown.penalties_saved > 0 && renderBreakdownItem('Penalties Saved', 
        pointsCalculation?.penalties_saved || liveData?.penalties_saved || 0, 
        breakdown.penalties_saved)}
      
      {/* Penalties Missed */}
      {breakdown.penalties_missed < 0 && renderBreakdownItem('Penalties Missed', 
        pointsCalculation?.penalties_missed || liveData?.penalties_missed || 0, 
        breakdown.penalties_missed)}
      
      {/* Yellow Cards */}
      {breakdown.yellow_cards < 0 && renderBreakdownItem('Yellow Cards', 
        pointsCalculation?.yellow_cards || liveData?.yellow_cards || 0, 
        breakdown.yellow_cards)}
      
      {/* Red Cards */}
      {breakdown.red_cards < 0 && renderBreakdownItem('Red Cards', 
        pointsCalculation?.red_cards || liveData?.red_cards || 0, 
        breakdown.red_cards)}
      
      {/* Own Goals */}
      {breakdown.own_goals < 0 && renderBreakdownItem('Own Goals', 
        pointsCalculation?.own_goals || liveData?.own_goals || 0, 
        breakdown.own_goals)}
      
      {/* Bonus */}
      {breakdown.bonus > 0 && renderBreakdownItem('Bonus', breakdown.bonus, breakdown.bonus)}
      
      {/* BPS */}
      {breakdown.bps > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-foreground/80">BPS</span>
          <span className="text-xs font-medium text-foreground">{breakdown.bps}</span>
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