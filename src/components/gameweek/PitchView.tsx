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

  const getFormationPlayers = () => {
    const formation = teamSelection?.formation || '4-4-2';
    const [def, mid, fwd] = formation.split('-').map(Number);
    
    return {
      defenders: Array.from({ length: def }, (_, i) => i + 2),
      midfielders: Array.from({ length: mid }, (_, i) => i + 2 + def),
      forwards: Array.from({ length: fwd }, (_, i) => i + 2 + def + mid)
    };
  };

  const { defenders, midfielders, forwards } = getFormationPlayers();

  return (
    <Card className="glass-card p-2">
      <div className="pitch-container">
        <div className="pitch-markings" />
        
        {/* Goalkeeper Areas */}
        <div className="goalkeeper-area left-4 top-1/2 -translate-y-1/2" />
        <div className="goalkeeper-area right-4 top-1/2 -translate-y-1/2" />
        
        {/* Player Positions */}
        <div className="absolute inset-0 grid grid-cols-4 px-8">
          {/* GK Column */}
          <div className="gk-column">
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
          
          {/* DEF Column */}
          <div className="def-column">
            {defenders.map(position => {
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
          
          {/* MID Column */}
          <div className="mid-column">
            {midfielders.map(position => {
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
          
          {/* FWD Column */}
          <div className="fwd-column">
            {forwards.map(position => {
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

        {/* Bench Section */}
        <BenchPlayers 
          benchPlayers={[12, 13, 14, 15]}
          getPlayerData={getPlayerData}
        />
      </div>
    </Card>
  );
}
