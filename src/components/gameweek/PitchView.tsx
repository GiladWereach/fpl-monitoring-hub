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

    // Find live data for the player
    const playerLiveData = liveData?.find(d => d?.player?.id === pick.element);
    
    console.log(`Player data for position ${position}:`, {
      player: player.web_name,
      pick,
      liveData: playerLiveData,
      totalPoints: playerLiveData?.points_calculation?.final_total_points || 0,
      inPlay: playerLiveData?.minutes > 0
    });

    return {
      ...player,
      isCaptain: pick.is_captain,
      isViceCaptain: pick.is_vice_captain,
      liveData: playerLiveData,
      fixture_id: playerLiveData?.fixture_id,
      totalPoints: playerLiveData?.points_calculation?.final_total_points || 0,
      inPlay: playerLiveData?.minutes > 0
    };
  };

  const { defenders, midfielders, forwards } = getFormationPlayers();
  const formationClass = `formation-${typeof teamSelection?.formation === 'string' 
    ? teamSelection.formation.replace(/-/g, '') 
    : teamSelection?.formation?.formation?.replace(/-/g, '') || '442'}`;

  console.log('PitchView render:', {
    formation: formationClass,
    hasTeamSelection: !!teamSelection,
    hasPlayers: !!players?.length,
    hasLiveData: !!liveData?.length,
    playerCount: players?.length,
    liveDataCount: liveData?.length
  });

  return (
    <div className="space-y-8">
      <div className="min-h-[800px] lg:min-h-[900px] xl:min-h-[1000px] relative w-full">
        <div className={`fpl-pitch-container ${formationClass}`}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 68 88" 
            preserveAspectRatio="xMidYMid meet"
          >
            <rect width="68" height="88" fill="#0D1117"/>
            <g fill="none" stroke="rgba(61, 255, 154, 0.35)" strokeWidth="0.25">
              {/* Main pitch boundary */}
              <rect x="1" y="1" width="66" height="86" rx="1.5"/>
              
              {/* Center elements */}
              <line x1="1" y1="44" x2="67" y2="44"/>
              <circle cx="34" cy="44" r="8.2"/>
              <circle cx="34" cy="44" r="0.5" fill="rgba(61, 255, 154, 0.35)"/>

              {/* Top penalty area */}
              <path d="M14 1v12h40V1"/>
              <path d="M24 1v4h20V1"/>
              <circle cx="34" cy="8" r="0.5" fill="rgba(61, 255, 154, 0.35)"/>
              <path d="M26.5 13a8.2 8.2 0 0 0 15 0"/>

              {/* Bottom penalty area */}
              <path d="M14 87v-9h40v9"/>
              <path d="M24 87v-3h20v3"/>
              <circle cx="34" cy="80" r="0.5" fill="rgba(61, 255, 154, 0.35)"/>
              <path d="M26.5 78a8.2 8.2 0 0 1 15 0"/>
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
      </div>

      <BenchSection getPlayerData={getPlayerData} eventId={eventId} />
    </div>
  );

  function getFormationPlayers() {
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
    
    const defenders = Array.from({ length: def }, (_, i) => i + 2);
    const midfielders = Array.from({ length: mid }, (_, i) => i + 2 + def);
    const forwards = Array.from({ length: fwd }, (_, i) => i + 2 + def + mid);

    console.log('Formation positions:', { defenders, midfielders, forwards });
    
    return { defenders, midfielders, forwards };
  }
}
