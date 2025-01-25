import React from 'react';
import { Loader2 } from 'lucide-react';
import { ViewToggle } from './ViewToggle';
import { PitchView } from './PitchView';
import { ListView } from './ListView';
import { LivePerformance } from './LivePerformance';
import { calculateTotalPoints, calculateBenchPoints } from './utils/points-calculator';

interface TeamViewProps {
  teamData: any;
  teamLoading: boolean;
  viewMode: 'pitch' | 'list';
  setViewMode: (mode: 'pitch' | 'list') => void;
  players?: any[];
  liveData?: any[];
}

export const TeamView: React.FC<TeamViewProps> = ({
  teamData,
  teamLoading,
  viewMode,
  setViewMode,
  players,
  liveData
}) => {
  if (teamLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#3DFF9A]" />
      </div>
    );
  }

  if (!teamData?.data) {
    return (
      <div className="flex h-[50vh] items-center justify-center flex-col gap-4">
        <p className="text-lg">No team data found for gameweek {teamData?.event}</p>
      </div>
    );
  }

  // Calculate points only from pitch players
  const getPlayerData = (pick: any) => {
    const playerLiveData = liveData?.find(p => p.player_id === pick.element);
    return {
      points: playerLiveData?.points_calculation?.final_total_points || 0,
      isCaptain: pick.is_captain
    };
  };

  const points = calculateTotalPoints(teamData.data.picks, getPlayerData);
  const benchPoints = calculateBenchPoints(teamData.data.picks, getPlayerData);

  console.log('TeamView points calculation:', {
    total_points: points,
    bench_points: benchPoints,
    picks: teamData.data.picks,
    live_data: liveData
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 relative">
        {viewMode === 'pitch' ? (
          <PitchView 
            teamSelection={teamData.data}
            players={players}
            liveData={liveData}
            eventId={teamData.data.team_info?.event}
          />
        ) : (
          <ListView
            teamSelection={teamData.data}
            players={players}
            liveData={liveData}
          />
        )}
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      </div>

      <div className="space-y-4">
        <LivePerformance 
          totalPoints={points}
          benchPoints={benchPoints}
          liveData={liveData}
          teamPicks={teamData.data.picks}
        />
      </div>
    </div>
  );
};