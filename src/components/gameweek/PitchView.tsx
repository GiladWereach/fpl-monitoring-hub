import React from 'react';
import { cn } from '@/lib/utils';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Card } from '@/components/ui/card';

interface PlayerCardProps {
  player: any;
  isCaptain: boolean;
  isViceCaptain: boolean;
  liveData?: any;
}

const PlayerCard = ({ player, isCaptain, isViceCaptain, liveData }: PlayerCardProps) => {
  const points = liveData?.total_points || 0;
  const finalPoints = isCaptain ? points * 2 : points;

  return (
    <HoverCard>
      <HoverCardTrigger>
        <div className="text-center">
          <div className="bg-[#3DFF9A]/10 px-4 py-2 rounded-full border border-[#3DFF9A]/20 hover:bg-[#3DFF9A]/20 transition-colors">
            <p className="text-sm font-medium">{player?.web_name}</p>
            {isCaptain && <span className="text-xs text-[#3DFF9A]">(C)</span>}
            {isViceCaptain && <span className="text-xs text-[#3DFF9A]">(V)</span>}
            <div className="text-xs mt-1 text-[#3DFF9A]">{finalPoints} pts</div>
          </div>
        </div>
      </HoverCardTrigger>
      {liveData && (
        <HoverCardContent className="w-80 bg-[#1A1F2C]/90 backdrop-blur-sm border-[#3DFF9A]/20">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Minutes</span>
              <span className="text-sm font-medium">{liveData.minutes}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Goals</span>
              <span className="text-sm font-medium">{liveData.goals_scored}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Assists</span>
              <span className="text-sm font-medium">{liveData.assists}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Clean Sheet</span>
              <span className="text-sm font-medium">{liveData.clean_sheets ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Bonus</span>
              <span className="text-sm font-medium">{liveData.bonus}</span>
            </div>
          </div>
        </HoverCardContent>
      )}
    </HoverCard>
  );
};

interface PitchViewProps {
  teamSelection?: any;
  players?: any[];
  liveData?: any[];
}

export function PitchView({ teamSelection, players, liveData }: PitchViewProps) {
  const getPlayerByPosition = (position: number) => {
    if (!teamSelection || !players) return null;
    const pick = teamSelection.picks.find(p => p.position === position);
    if (!pick) return null;
    
    const player = players.find(p => p.id === pick.element);
    const playerLiveData = liveData?.find(d => d.player_id === pick.element);
    
    return {
      ...player,
      isCaptain: pick.is_captain,
      isViceCaptain: pick.is_vice_captain,
      liveData: playerLiveData
    };
  };

  return (
    <Card className="glass-card p-6">
      <div className="relative h-[600px] w-full">
        {/* Pitch Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#3DFF9A]/5 to-transparent rounded-lg border border-[#3DFF9A]/10">
          {/* Field Lines */}
          <div className="absolute inset-0 flex">
            <div className="w-1/3 border-r border-[#3DFF9A]/20" />
            <div className="w-1/3 border-r border-[#3DFF9A]/20" />
          </div>
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-[#3DFF9A]/20 rounded-full" />
        </div>
        
        {/* Player Positions */}
        <div className="absolute inset-0 flex">
          {/* GK Column */}
          <div className="w-1/4 flex items-center justify-center">
            <div className="space-y-4">
              {[1].map(position => {
                const player = getPlayerByPosition(position);
                if (!player) return null;
                return (
                  <PlayerCard 
                    key={position}
                    player={player}
                    isCaptain={player.isCaptain}
                    isViceCaptain={player.isViceCaptain}
                    liveData={player.liveData}
                  />
                );
              })}
            </div>
          </div>
          
          {/* DEF Column */}
          <div className="w-1/4 flex items-center justify-center">
            <div className="space-y-4">
              {[2, 3, 4, 5].map(position => {
                const player = getPlayerByPosition(position);
                if (!player) return null;
                return (
                  <PlayerCard 
                    key={position}
                    player={player}
                    isCaptain={player.isCaptain}
                    isViceCaptain={player.isViceCaptain}
                    liveData={player.liveData}
                  />
                );
              })}
            </div>
          </div>
          
          {/* MID Column */}
          <div className="w-1/4 flex items-center justify-center">
            <div className="space-y-4">
              {[6, 7, 8].map(position => {
                const player = getPlayerByPosition(position);
                if (!player) return null;
                return (
                  <PlayerCard 
                    key={position}
                    player={player}
                    isCaptain={player.isCaptain}
                    isViceCaptain={player.isViceCaptain}
                    liveData={player.liveData}
                  />
                );
              })}
            </div>
          </div>
          
          {/* FWD Column */}
          <div className="w-1/4 flex items-center justify-center">
            <div className="space-y-4">
              {[9, 10, 11].map(position => {
                const player = getPlayerByPosition(position);
                if (!player) return null;
                return (
                  <PlayerCard 
                    key={position}
                    player={player}
                    isCaptain={player.isCaptain}
                    isViceCaptain={player.isViceCaptain}
                    liveData={player.liveData}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}