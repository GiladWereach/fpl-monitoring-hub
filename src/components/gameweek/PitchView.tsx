import React from 'react';
import { GoalkeeperRow } from './pitch/GoalkeeperRow';
import { PlayerRow } from './pitch/PlayerRow';
import { BenchSection } from './pitch/BenchSection';

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
  const formationClass = typeof teamSelection?.formation === 'string' ? 
    `formation-${teamSelection.formation.replace(/-/g, '')}` : 'formation-442';

  return (
    <div className="space-y-8">
      <div className={`fpl-pitch-container ${formationClass}`}>
        <svg 
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 800 600" 
          preserveAspectRatio="xMidYMid slice"
        >
          <rect width="800" height="600" fill="#1A1F2C"/>
          <path 
            d="M 50 50 L 750 50 L 750 550 L 50 550 Z" 
            fill="none" 
            stroke="rgba(61, 255, 154, 0.15)" 
            strokeWidth="2"
          />
          <path 
            d="M 400 50 L 400 550" 
            fill="none" 
            stroke="rgba(61, 255, 154, 0.15)" 
            strokeWidth="2"
          />
          <circle 
            cx="400" 
            cy="300" 
            r="50" 
            fill="none" 
            stroke="rgba(61, 255, 154, 0.15)" 
            strokeWidth="2"
          />
          <circle 
            cx="400" 
            cy="300" 
            r="2" 
            fill="rgba(61, 255, 154, 0.15)"
          />
          <path 
            d="M 250 50 L 550 50 L 550 150 L 250 150 Z" 
            fill="none" 
            stroke="rgba(61, 255, 154, 0.15)" 
            strokeWidth="2"
          />
          <path 
            d="M 250 550 L 550 550 L 550 450 L 250 450 Z" 
            fill="none" 
            stroke="rgba(61, 255, 154, 0.15)" 
            strokeWidth="2"
          />
        </svg>

        <div className="fpl-position-labels">
          <span className="fpl-position-label">GK</span>
          <span className="fpl-position-label">DEF</span>
          <span className="fpl-position-label">MID</span>
          <span className="fpl-position-label">FWD</span>
        </div>
        
        <div className="fpl-pitch-grid">
          <GoalkeeperRow getPlayerData={getPlayerData} eventId={eventId} />
          <PlayerRow 
            positions={defenders} 
            getPlayerData={getPlayerData} 
            eventId={eventId}
            className="fpl-def-row"
          />
          <PlayerRow 
            positions={midfielders} 
            getPlayerData={getPlayerData} 
            eventId={eventId}
            className="fpl-mid-row"
          />
          <PlayerRow 
            positions={forwards} 
            getPlayerData={getPlayerData} 
            eventId={eventId}
            className="fpl-fwd-row"
          />
        </div>
      </div>

      <BenchSection getPlayerData={getPlayerData} eventId={eventId} />
    </div>
  );
}