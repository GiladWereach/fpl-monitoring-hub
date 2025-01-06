import React from 'react';

interface PointsBreakdownProps {
  pointsData: any;
  isCaptain: boolean;
  isViceCaptain: boolean;
  bonusPoints?: number;
}

export function PointsBreakdown({ 
  pointsData, 
  isCaptain, 
  isViceCaptain,
  bonusPoints = 0
}: PointsBreakdownProps) {
  if (!pointsData) return null;

  const basePoints = pointsData.final_total_points || 0;
  const totalPoints = isCaptain ? (basePoints + bonusPoints) * 2 : basePoints + bonusPoints;

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span>Base</span>
        <span>{basePoints}</span>
      </div>
      {bonusPoints > 0 && (
        <div className="flex justify-between text-[#3DFF9A]">
          <span>Bonus</span>
          <span>+{bonusPoints}</span>
        </div>
      )}
      {isCaptain && (
        <div className="flex justify-between text-[#eaff80]">
          <span>Captain (×2)</span>
          <span>×2</span>
        </div>
      )}
      <div className="border-t pt-1 flex justify-between font-bold">
        <span>Total</span>
        <span>{totalPoints}</span>
      </div>
    </div>
  );
}