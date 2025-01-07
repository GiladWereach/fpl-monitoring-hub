import React from 'react';
import { PointsBreakdown as PointsBreakdownType } from '@/utils/points-calculator';

interface PointsBreakdownProps {
  pointsData: PointsBreakdownType | null;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

export function PointsBreakdown({ 
  pointsData,
  isCaptain,
  isViceCaptain
}: PointsBreakdownProps) {
  if (!pointsData) return null;

  const renderPointLine = (label: string, points: number) => {
    if (points === 0) return null;
    return (
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className={points < 0 ? 'text-red-500' : ''}>
          {points > 0 ? `+${points}` : points}
        </span>
      </div>
    );
  };

  const basePoints = pointsData.total / (isCaptain ? 2 : 1);

  return (
    <div className="space-y-2 text-sm">
      {renderPointLine('Minutes', pointsData.minutes)}
      {renderPointLine('Goals', pointsData.goals)}
      {renderPointLine('Assists', pointsData.assists)}
      {renderPointLine('Clean Sheet', pointsData.cleanSheets)}
      {renderPointLine('Goals Conceded', pointsData.goalsConceded)}
      {renderPointLine('Own Goals', pointsData.ownGoals)}
      {renderPointLine('Penalties Saved', pointsData.penaltiesSaved)}
      {renderPointLine('Penalties Missed', pointsData.penaltiesMissed)}
      {renderPointLine('Yellow Cards', pointsData.yellowCards)}
      {renderPointLine('Red Cards', pointsData.redCards)}
      {renderPointLine('Saves', pointsData.saves)}
      {renderPointLine('Bonus', pointsData.bonus)}
      
      {isCaptain && (
        <div className="flex justify-between text-[#eaff80]">
          <span>Captain (×2)</span>
          <span>×2</span>
        </div>
      )}
      
      <div className="border-t pt-1 flex justify-between font-bold">
        <span>Total</span>
        <span>{pointsData.total}</span>
      </div>
    </div>
  );
}