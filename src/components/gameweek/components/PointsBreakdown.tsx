import React from 'react';

interface PointsBreakdownProps {
  pointsData?: any;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

export function PointsBreakdown({ pointsData, isCaptain, isViceCaptain }: PointsBreakdownProps) {
  if (!pointsData) return null;

  const renderBreakdownItem = (label: string, value: number) => {
    if (value === 0) return null;
    const pointsToShow = isCaptain ? value * 2 : value;
    return (
      <div className="flex justify-between items-center">
        <span className="text-xs text-foreground/80">{label}</span>
        <span className="text-xs font-medium text-foreground">+{pointsToShow}</span>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {pointsData.minutes_points > 0 && renderBreakdownItem('Minutes', pointsData.minutes_points)}
      {pointsData.goals_scored_points > 0 && renderBreakdownItem('Goals', pointsData.goals_scored_points)}
      {pointsData.assist_points > 0 && renderBreakdownItem('Assists', pointsData.assist_points)}
      {pointsData.clean_sheet_points > 0 && renderBreakdownItem('Clean Sheet', pointsData.clean_sheet_points)}
      {pointsData.saves_points > 0 && renderBreakdownItem('Saves', pointsData.saves_points)}
      {pointsData.bonus_points > 0 && renderBreakdownItem('Bonus', pointsData.bonus_points)}
      
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