import React from 'react';
import { GoalkeeperRow } from './pitch/GoalkeeperRow';
import { PlayerRow } from './pitch/PlayerRow';
import { BenchSection } from './pitch/BenchSection';
import { ViewToggle } from './ViewToggle';

interface PitchViewProps {
  teamSelection?: any;
  players?: any[];
  liveData?: any[];
  eventId?: number;
  viewMode: 'pitch' | 'list';
  setViewMode: (mode: 'pitch' | 'list') => void;
}

export function PitchView({ 
  teamSelection, 
  players, 
  liveData, 
  eventId,
  viewMode,
  setViewMode 
}: PitchViewProps) {
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
    <div className="space-y-4">
      <div className="min-h-[600px] lg:min-h-[600px] xl:min-h-[600px] relative w-full">
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        <div className={`fpl-pitch-container ${formationClass}`}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 68 55" 
            preserveAspectRatio="xMidYMid meet"
          >
            <rect width="68" height="55" fill="#0D1117"/>
            <g fill="none" stroke="rgba(61, 255, 154, 0.35)" strokeWidth="0.25">
              {/* Main pitch boundary */}
              <rect x="1" y="1" width="66" height="53" rx="1.5"/>
              
              {/* Center elements */}
              <line x1="1" y1="27" x2="67" y2="27"/>
              <circle cx="34" cy="27" r="5"/>
              <circle cx="34" cy="27" r="0.5" fill="rgba(61, 255, 154, 0.35)"/>

              {/* Top penalty area */}
              <path d="M14 1v6h40V1"/>
              <path d="M24 1v2h20V1"/>
              <circle cx="34" cy="4" r="0.5" fill="rgba(61, 255, 154, 0.35)"/>
              <path d="M27.5 7a5 5 0 0 0 13 0"/>

              {/* Bottom penalty area */}
              <path d="M14 54v-6h40v6"/>
              <path d="M24 54v-2h20v2"/>
              <circle cx="34" cy="50" r="0.5" fill="rgba(61, 255, 154, 0.35)"/>
              <path d="M27.5 48a5 5 0 0 1 13 0"/>
            </g>
          </svg>
          
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
