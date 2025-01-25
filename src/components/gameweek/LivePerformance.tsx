import { Card } from '@/components/ui/card';

interface LivePerformanceProps {
  totalPoints: number;
  benchPoints: number;
  liveData: any[];
  teamPicks: any[];
}

export function LivePerformance({ totalPoints, benchPoints, liveData, teamPicks }: LivePerformanceProps) {
  // Filter live data to only include pitch players (positions 1-11)
  const pitchPlayersData = liveData?.filter(p => {
    const pick = teamPicks?.find(pick => pick.element === p.player_id);
    return pick && pick.position <= 11;
  });

  // Calculate stats only for pitch players
  const pitchGoals = pitchPlayersData?.reduce((sum, p) => sum + (p.goals_scored || 0), 0) || 0;
  const pitchAssists = pitchPlayersData?.reduce((sum, p) => sum + (p.assists || 0), 0) || 0;
  const pitchBonus = pitchPlayersData?.reduce((sum, p) => sum + (p.bonus || 0), 0) || 0;
  const playersPlaying = pitchPlayersData?.filter(p => p.minutes > 0).length || 0;

  console.log('LivePerformance stats:', {
    pitchPlayersData,
    pitchGoals,
    pitchAssists,
    pitchBonus,
    playersPlaying,
    totalPoints,
    benchPoints
  });

  return (
    <div className="space-y-4">
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Live Performance</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Points</span>
            <span className="font-medium">{totalPoints}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Bench Points</span>
            <span className="font-medium">{benchPoints}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Goals</span>
            <span className="font-medium">{pitchGoals}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Assists</span>
            <span className="font-medium">{pitchAssists}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Bonus Points</span>
            <span className="font-medium">{pitchBonus}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Players Playing</span>
            <span className="font-medium">{playersPlaying}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}