import React from 'react';

interface PointsBreakdownProps {
  liveData?: any;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

export function PointsBreakdown({ liveData, isCaptain, isViceCaptain }: PointsBreakdownProps) {
  if (!liveData) return null;

  const renderBreakdownItem = (label: string, value: number) => {
    if (value === 0) return null;
    return (
      <div className="flex justify-between items-center">
        <span className="text-xs text-foreground/80">{label}</span>
        <span className="text-xs font-medium text-foreground">+{value}</span>
      </div>
    );
  };

  // Calculate points based on live data
  const points = {
    minutes: liveData.minutes >= 60 ? 2 : liveData.minutes > 0 ? 1 : 0,
    goals: liveData.goals_scored * (liveData.element_type === 1 ? 6 : liveData.element_type === 2 ? 6 : liveData.element_type === 3 ? 5 : 4),
    assists: liveData.assists * 3,
    cleanSheet: liveData.clean_sheets && (liveData.element_type <= 2) ? 4 : 0,
    saves: Math.floor(liveData.saves / 3),
    bonus: liveData.bonus || 0
  };

  return (
    <div className="space-y-2">
      {liveData.minutes > 0 && renderBreakdownItem('Minutes', points.minutes)}
      {liveData.goals_scored > 0 && renderBreakdownItem('Goals', points.goals)}
      {liveData.assists > 0 && renderBreakdownItem('Assists', points.assists)}
      {liveData.clean_sheets > 0 && renderBreakdownItem('Clean Sheet', points.cleanSheet)}
      {liveData.saves >= 3 && renderBreakdownItem('Saves', points.saves)}
      {liveData.bonus > 0 && renderBreakdownItem('Bonus', points.bonus)}
      
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