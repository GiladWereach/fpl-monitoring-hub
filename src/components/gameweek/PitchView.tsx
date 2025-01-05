import React from 'react';
import { Card } from '@/components/ui/card';
import { PlayerCard } from './PlayerCard';

interface PitchViewProps {
  teamSelection?: any;
  players?: any[];
  liveData?: any[];
  eventId?: number;
}

export function PitchView({ teamSelection, players, liveData, eventId }: PitchViewProps) {
  const getPlayerData = (position: number) => {
    if (!teamSelection || !players) return null;
    const pick = teamSelection.picks.find(p => p.position === position);
    if (!pick) return null;
    
    const player = players.find(p => p.id === pick.element);
    const playerLiveData = liveData?.find(d => d.player_id === pick.element);
    
    console.log('Player Live Data:', {
      player_id: player?.id,
      web_name: player?.web_name,
      chance_of_playing: player?.chance_of_playing_this_round,
      status: player?.status,
      live_data: playerLiveData ? {
        minutes: playerLiveData.minutes,
        total_points: playerLiveData.total_points,
        fixture_id: playerLiveData.fixture_id,
        points_breakdown: playerLiveData.points_breakdown
      } : 'No live data'
    });

    return {
      ...player,
      isCaptain: pick.is_captain,
      isViceCaptain: pick.is_vice_captain,
      liveData: playerLiveData,
      fixture_id: playerLiveData?.fixture_id
    };
  };

  const getFormationPlayers = () => {
    const formationString = typeof teamSelection?.formation === 'string' ? 
      teamSelection.formation : '4-4-2';
    
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

  if (!eventId) {
    console.warn('No eventId provided to PitchView');
    return null;
  }

  const { defenders, midfielders, forwards } = getFormationPlayers();

  return (
    <div className="space-y-4">
      <Card className="glass-card p-2">
        <div className="pitch-container">
          <div className="pitch-markings" />
          <div className="goalkeeper-area goalkeeper-area-top" />
          
          <div className="pitch-grid">
            {/* GK Row */}
            <div className="gk-row">
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
                    fixture_id={player.fixture_id}
                    eventId={eventId}
                  />
                );
              })}
            </div>
            
            {/* DEF Row */}
            <div className="def-row">
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
                    fixture_id={player.fixture_id}
                    eventId={eventId}
                  />
                );
              })}
            </div>
            
            {/* MID Row */}
            <div className="mid-row">
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
                    fixture_id={player.fixture_id}
                    eventId={eventId}
                  />
                );
              })}
            </div>
            
            {/* FWD Row */}
            <div className="fwd-row">
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
                    fixture_id={player.fixture_id}
                    eventId={eventId}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Bench Section */}
      <div className="bench-section">
        <h3 className="text-sm font-semibold mb-4">Bench Players</h3>
        <div className="bench-grid">
          {[12, 13, 14, 15].map((position) => {
            const playerData = getPlayerData(position);
            if (!playerData) return null;
            
            return (
              <PlayerCard
                key={position}
                player={playerData}
                isCaptain={playerData.isCaptain}
                isViceCaptain={playerData.isViceCaptain}
                liveData={playerData.liveData}
                eventId={eventId}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}