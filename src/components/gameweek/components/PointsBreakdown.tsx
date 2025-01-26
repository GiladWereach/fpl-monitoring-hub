import React from 'react';

export interface PointsBreakdownProps {
  pointsData: any;
  isCaptain: boolean;
  isViceCaptain: boolean;
  liveData?: any;
  onClose: () => void;
}

export function PointsBreakdown({ 
  pointsData,
  isCaptain,
  isViceCaptain,
  liveData,
  onClose 
}: PointsBreakdownProps) {
  if (!pointsData) return null;

  const renderPointLine = (label: string, points: number, count?: number) => {
    if (points === 0 && !count) return null;
    return (
      <div className="flex justify-between text-sm">
        <span>
          {label}
          {count !== undefined && count > 0 && (
            <span className="text-muted-foreground ml-1">
              ({count})
            </span>
          )}
        </span>
        <span className={points < 0 ? 'text-red-500' : ''}>
          {points > 0 ? `+${points}` : points}
        </span>
      </div>
    );
  };

  return (
    <div className="absolute top-0 left-0 w-[200px] p-4 bg-secondary/95 backdrop-blur-sm border border-accent/20 rounded-lg shadow-xl z-50 space-y-2">
      <button 
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
      >
        ×
      </button>
      
      {renderPointLine('Minutes', pointsData.minutes_points, liveData?.minutes)}
      {renderPointLine('Goals', pointsData.goals_scored_points, liveData?.goals_scored)}
      {renderPointLine('Assists', pointsData.assist_points, liveData?.assists)}
      {renderPointLine('Clean Sheet', pointsData.clean_sheet_points, liveData?.clean_sheets)}
      {renderPointLine('Goals Conceded', pointsData.goals_conceded_points, liveData?.goals_conceded)}
      {renderPointLine('Own Goals', pointsData.own_goal_points, liveData?.own_goals)}
      {renderPointLine('Penalties Saved', pointsData.penalty_save_points, liveData?.penalties_saved)}
      {renderPointLine('Penalties Missed', pointsData.penalty_miss_points, liveData?.penalties_missed)}
      {renderPointLine('Yellow Cards', pointsData.card_points, liveData?.yellow_cards)}
      {renderPointLine('Red Cards', pointsData.card_points, liveData?.red_cards)}
      {renderPointLine('Saves', pointsData.saves_points, liveData?.saves)}
      {renderPointLine('Bonus', pointsData.bonus_points, liveData?.bonus)}
      
      <div className="border-t pt-1 flex justify-between font-bold">
        <span>Total</span>
        <span>{isCaptain ? pointsData.final_total_points * 2 : pointsData.final_total_points}</span>
      </div>

      {isCaptain && (
        <div className="text-[#eaff80] text-center text-xs">
          Captain bonus applied (×2)
        </div>
      )}
    </div>
  );
}