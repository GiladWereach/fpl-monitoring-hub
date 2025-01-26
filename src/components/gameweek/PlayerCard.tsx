import React from 'react';
import { cn } from '@/lib/utils';
import { PlayerStatus } from './PlayerStatus';
import { PointsBreakdown } from './components/PointsBreakdown';

interface PlayerCardProps {
  player: any;
  liveData?: any;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  eventId?: number;
  className?: string;
}

export function PlayerCard({ 
  player, 
  liveData, 
  isCaptain, 
  isViceCaptain,
  eventId,
  className 
}: PlayerCardProps) {
  const [showBreakdown, setShowBreakdown] = React.useState(false);
  
  if (!player) {
    console.log('No player data provided to PlayerCard');
    return null;
  }

  const finalPoints = liveData?.points_calculation?.final_total_points || 0;
  const inPlay = liveData?.minutes > 0;
  const hasStarted = liveData?.fixture?.started;
  const isFinished = liveData?.fixture?.finished;

  const getPointsDisplay = () => {
    if (isCaptain) {
      return `${finalPoints * 2}`;
    }
    return finalPoints;
  };

  console.log('PlayerCard render:', {
    player: player.web_name,
    isCaptain,
    isViceCaptain,
    finalPoints,
    inPlay,
    hasStarted,
    isFinished,
    liveData: !!liveData
  });

  return (
    <div 
      className={cn(
        "relative w-[90px] h-[110px] bg-secondary/90 backdrop-blur-sm rounded-lg border border-accent/20 shadow-lg cursor-pointer transition-all duration-300",
        "hover:scale-105 hover:border-[#3DFF9A]/40 hover:bg-secondary/95",
        {
          "border-[#3DFF9A]/40": inPlay,
          "opacity-75": !hasStarted,
        },
        className
      )}
      onClick={() => setShowBreakdown(!showBreakdown)}
    >
      <div className="flex flex-col items-center justify-center h-full p-2">
        <div className="text-xs text-center mb-1">
          {player.web_name}
        </div>
        
        {(isCaptain || isViceCaptain) && (
          <div className="text-[10px] text-[#3DFF9A] mb-1">
            {isCaptain ? '(C)' : '(V)'}
          </div>
        )}

        <div 
          className={cn(
            "text-lg font-bold",
            {
              "text-[#3DFF9A]": finalPoints > 0,
              "text-gray-400": finalPoints === 0
            }
          )}
        >
          {getPointsDisplay()}
        </div>

        <div className="absolute bottom-2 left-2">
          <PlayerStatus 
            player={player} 
            liveData={liveData}
          />
        </div>
      </div>

      {showBreakdown && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowBreakdown(false)} />
          <div className="relative z-[101]">
            <PointsBreakdown
              pointsData={liveData?.points_calculation}
              isCaptain={isCaptain}
              isViceCaptain={isViceCaptain}
              liveData={liveData}
              onClose={() => setShowBreakdown(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}