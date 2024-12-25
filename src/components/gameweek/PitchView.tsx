import React from 'react';
import { Card } from '@/components/ui/card';
import { PlayerCard } from './PlayerCard';
import { BenchPlayers } from './BenchPlayers';

interface PitchViewProps {
  teamSelection?: any;
  players?: any[];
  liveData?: any[];
}

export function PitchView({ teamSelection, players, liveData }: PitchViewProps) {
  const getPlayerData = (position: number) => {
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
      <div className="pitch-container">
        <div className="pitch-markings" />
        
        {/* Goalkeeper Areas */}
        <div className="goalkeeper-area left-4 top-1/2 -translate-y-1/2" />
        <div className="goalkeeper-area right-4 top-1/2 -translate-y-1/2" />
        
        {/* Player Positions */}
        <div className="absolute inset-0 flex">
          {/* GK Column */}
          <div className="w-1/4 flex items-center justify-center">
            <div className="space-y-4">
              {[1].map(position => {
                const player = getPlayerData(position);
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
                const player = getPlayerData(position);
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
                const player = getPlayerData(position);
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
                const player = getPlayerData(position);
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

        {/* Bench Section */}
        <BenchPlayers 
          benchPlayers={[12, 13, 14, 15]}
          getPlayerData={getPlayerData}
        />
      </div>
    </Card>
  );
}
