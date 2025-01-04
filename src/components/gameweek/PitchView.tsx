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
    
    console.log('Player Live Data:', {
      player_id: player?.id,
      web_name: player?.web_name,
      live_data: playerLiveData ? {
        minutes: playerLiveData.minutes,
        total_points: playerLiveData.total_points,
        bonus: playerLiveData.bonus
      } : 'No live data'
    });

    return {
      ...player,
      isCaptain: pick.is_captain,
      isViceCaptain: pick.is_vice_captain,
      liveData: playerLiveData,
      bonus: playerLiveData?.bonus || 0
    };
  };

  const getFormationPlayers = () => {
    // Ensure formation is a string and has a valid format, default to '4-4-2' if not
    const formationString = typeof teamSelection?.formation === 'string' ? 
      teamSelection.formation : '4-4-2';
    
    // Validate formation format
    if (!/^\d-\d-\d$/.test(formationString)) {
      console.warn('Invalid formation format, defaulting to 4-4-2');
      return {
        defenders: [2, 3, 4, 5],
        midfielders: [6, 7, 8, 9],
        forwards: [10, 11]
      };
    }

    const [def, mid, fwd] = formationString.split('-').map(Number);
    
    return {
      defenders: Array.from({ length: def }, (_, i) => i + 2),
      midfielders: Array.from({ length: mid }, (_, i) => i + 2 + def),
      forwards: Array.from({ length: fwd }, (_, i) => i + 2 + def + mid)
    };
  };

  const { defenders, midfielders, forwards } = getFormationPlayers();

  return (
    <div className="space-y-4">
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
        </div>
      </Card>

      {/* Bench Section */}
      <BenchPlayers 
        benchPlayers={[12, 13, 14, 15]}
        getPlayerData={getPlayerData}
      />
    </div>
  );
}
