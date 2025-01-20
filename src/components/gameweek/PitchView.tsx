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
    if (!teamSelection?.picks || !players) {
      console.log('Missing required data:', { 
        hasPicks: !!teamSelection?.picks, 
        hasPlayers: !!players,
        position 
      });
      return null;
    }
    
    const pick = teamSelection.picks.find(p => p.position === position);
    if (!pick) {
      console.log(`No pick found for position ${position}`);
      return null;
    }
    
    const player = players.find(p => p.id === pick.element);
    if (!player) {
      console.log(`No player found for element ${pick.element} at position ${position}`);
      return null;
    }

    // Add null check for player object in live data
    const playerLiveData = liveData?.find(d => d?.player && d.player.id === pick.element);
    
    // Calculate total points including bonus if available
    const totalPoints = playerLiveData?.points_calculation?.final_total_points || 
                       playerLiveData?.total_points || 
                       0;

    // Apply captain multiplier
    const finalPoints = pick.is_captain ? totalPoints * 2 : totalPoints;
    
    console.log('PitchView player data:', {
      position,
      player_id: player?.id,
      web_name: player?.web_name,
      total_points: finalPoints,
      live_data: playerLiveData ? {
        minutes: playerLiveData.minutes,
        total_points: playerLiveData.total_points,
        points_calculation: playerLiveData.points_calculation
      } : 'No live data'
    });

    const isInPlay = playerLiveData?.minutes > 0 && 
                    !playerLiveData?.finished_provisional && 
                    !playerLiveData?.postponed;

    console.log(`Player ${player.web_name} inPlay status:`, {
      minutes: playerLiveData?.minutes,
      finished_provisional: playerLiveData?.finished_provisional,
      postponed: playerLiveData?.postponed,
      isInPlay
    });

    return {
      ...player,
      isCaptain: pick.is_captain,
      isViceCaptain: pick.is_vice_captain,
      liveData: playerLiveData,
      fixture_id: playerLiveData?.fixture_id,
      totalPoints: finalPoints,
      inPlay: isInPlay
    };
  };

  const getFormationPlayers = () => {
    // Get formation string from the correct path
    const formationString = typeof teamSelection?.formation === 'string' 
      ? teamSelection.formation 
      : teamSelection?.formation?.formation || '4-4-2';

    console.log('Formation:', formationString);
    
    if (!/^\d-\d-\d$/.test(formationString)) {
      console.warn('Invalid formation format:', formationString);
      return {
        defenders: [2, 3, 4, 5],
        midfielders: [6, 7, 8, 9],
        forwards: [10, 11]
      };
    }

    const [def, mid, fwd] = formationString.split('-').map(Number);
    
    // Calculate positions based on formation
    const defenders = Array.from({ length: def }, (_, i) => i + 2);
    const midfielders = Array.from({ length: mid }, (_, i) => i + 2 + def);
    const forwards = Array.from({ length: fwd }, (_, i) => i + 2 + def + mid);

    console.log('Formation positions:', { defenders, midfielders, forwards });
    
    return { defenders, midfielders, forwards };
  };

  if (!eventId) {
    console.warn('No eventId provided to PitchView');
    return null;
  }

  const { defenders, midfielders, forwards } = getFormationPlayers();
  const formationClass = `formation-${typeof teamSelection?.formation === 'string' 
    ? teamSelection.formation.replace(/-/g, '') 
    : teamSelection?.formation?.formation?.replace(/-/g, '') || '442'}`;

  return (
    <div className="space-y-8">
      <div className={`fpl-pitch-container ${formationClass}`}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 68 105" 
          preserveAspectRatio="xMidYMid slice"
        >
          <rect width="68" height="105" fill="#0D1117"/>
          <g fill="none" stroke="rgba(61, 255, 154, 0.35)" strokeWidth="0.25">
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