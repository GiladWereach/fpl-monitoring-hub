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
          xmlns="http://www.w3.org/2000/svg" 
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 74 111" 
          preserveAspectRatio="xMidYMid slice"
        >
          <rect width="74" height="111" fill="#0D1117"/>
          <g fill="none" stroke="rgba(61, 255, 154, 0.35)" strokeWidth="0.25" transform="translate(3 3)">
            {/* Main pitch border */}
            <path d="M 0 0 h 68 v 105 h -68 Z"/>
            
            {/* Center line */}
            <path d="M 0 52.5 h 68"/>
            
            {/* Center circle */}
            <circle r="9.15" cx="34" cy="52.5"/>
            <circle r="0.5" cx="34" cy="52.5" fill="rgba(61, 255, 154, 0.35)"/>
            
            {/* Top penalty area */}
            <path d="M 13.84 0 v 16.5 h 40.32 v -16.5"/>
            <path d="M 24.84 0 v 5.5 h 18.32 v -5.5"/>
            <circle r="0.5" cx="34" cy="10.94" fill="rgba(61, 255, 154, 0.35)"/>
            <path d="M 26.733027 16.5 a 9.15 9.15 0 0 0 14.533946 0"/>
            
            {/* Bottom penalty area (mirrored) */}
            <path d="M 13.84 105 v -16.5 h 40.32 v 16.5"/>
            <path d="M 24.84 105 v -5.5 h 18.32 v 5.5"/>
            <circle r="0.5" cx="34" cy="94.06" fill="rgba(61, 255, 154, 0.35)"/>
            <path d="M 26.733027 88.5 a 9.15 9.15 0 0 1 14.533946 0"/>
            
            {/* Corner arcs */}
            <path d="M 0 2 a 2 2 0 0 0 2 -2"/>
            <path d="M 66 0 a 2 2 0 0 0 2 2"/>
            <path d="M 68 103 a 2 2 0 0 0 -2 2"/>
            <path d="M 2 105 a 2 2 0 0 0 -2 -2"/>
          </g>
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