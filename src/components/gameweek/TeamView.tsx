import React from 'react';
import { Loader2 } from 'lucide-react';
import { ViewToggle } from './ViewToggle';
import { PitchView } from './PitchView';
import { ListView } from './ListView';
import { LivePerformance } from './LivePerformance';

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

  const { points = 0, benchPoints = 0 } = teamData.data.stats || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 relative">
        {viewMode === 'pitch' ? (
          <PitchView 
            teamSelection={teamData.data}
            players={players}
            liveData={liveData}
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
        />
      </div>
    </div>
  );
};