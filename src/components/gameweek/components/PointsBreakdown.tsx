import React from 'react';

export interface PointsBreakdown {
  minutes: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  goalsConceded: number;
  ownGoals: number;
  penaltiesSaved: number;
  penaltiesMissed: number;
  yellowCards: number;
  redCards: number;
  saves: number;
  bonus: number;
  total: number;
}

interface PointsBreakdownProps {
  pointsData: PointsBreakdown | null;
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