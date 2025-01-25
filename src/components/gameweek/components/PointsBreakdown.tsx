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
  liveData?: {
    minutes?: number;
    goals_scored?: number;
    assists?: number;
    clean_sheets?: number;
    goals_conceded?: number;
    own_goals?: number;
    penalties_saved?: number;
    penalties_missed?: number;
    yellow_cards?: number;
    red_cards?: number;
    saves?: number;
    bonus?: number;
  };
}

export function PointsBreakdown({ 
  pointsData,
  isCaptain,
  isViceCaptain,
  liveData
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
              ({count}x)
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
    <div className="space-y-2 text-sm">
      {renderPointLine('Minutes', pointsData.minutes, liveData?.minutes)}
      {renderPointLine('Goals', pointsData.goals, liveData?.goals_scored)}
      {renderPointLine('Assists', pointsData.assists, liveData?.assists)}
      {renderPointLine('Clean Sheet', pointsData.cleanSheets, liveData?.clean_sheets)}
      {renderPointLine('Goals Conceded', pointsData.goalsConceded, liveData?.goals_conceded)}
      {renderPointLine('Own Goals', pointsData.ownGoals, liveData?.own_goals)}
      {renderPointLine('Penalties Saved', pointsData.penaltiesSaved, liveData?.penalties_saved)}
      {renderPointLine('Penalties Missed', pointsData.penaltiesMissed, liveData?.penalties_missed)}
      {renderPointLine('Yellow Cards', pointsData.yellowCards, liveData?.yellow_cards)}
      {renderPointLine('Red Cards', pointsData.redCards, liveData?.red_cards)}
      {renderPointLine('Saves', pointsData.saves, liveData?.saves)}
      {renderPointLine('Bonus', pointsData.bonus, liveData?.bonus)}
      
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