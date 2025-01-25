import { Card } from '@/components/ui/card';
import { Trophy, Users, TrendingUp, Clock } from 'lucide-react';
import { StatusCard } from '@/components/dashboard/StatusCard';

interface GameweekHeaderProps {
  currentGameweek: any;
  totalPoints: number;
  playersPlaying: number;
  liveData?: any[];
  teamPicks?: any[];
}

export function GameweekHeader({ 
  currentGameweek, 
  totalPoints, 
  playersPlaying,
  liveData,
  teamPicks 
}: GameweekHeaderProps) {
  // Calculate stats for pitch players only
  const pitchPlayersData = liveData?.filter(p => {
    const pick = teamPicks?.find(pick => pick.element === p.player_id);
    return pick && pick.position <= 11;
  });

  const pitchGoals = pitchPlayersData?.reduce((sum, p) => sum + (p.goals_scored || 0), 0) || 0;
  const pitchAssists = pitchPlayersData?.reduce((sum, p) => sum + (p.assists || 0), 0) || 0;
  const pitchBonus = pitchPlayersData?.reduce((sum, p) => sum + (p.bonus || 0), 0) || 0;

  console.log('GameweekHeader stats:', {
    totalPoints,
    playersPlaying,
    pitchGoals,
    pitchAssists,
    pitchBonus,
    liveDataCount: liveData?.length
  });

  return (
    <div className="relative mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#3DFF9A] to-[#50E3C2]">
            Gameweek {currentGameweek?.id} Live
          </h1>
          <p className="text-gray-400 mt-2">
            Track your team's performance in real-time with detailed statistics and live updates
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:w-2/3">
          <StatusCard
            title="Total Points"
            value={totalPoints}
            status="success"
            icon={<Trophy className="h-4 w-4" />}
            details={[
              { label: 'Goals', value: pitchGoals },
              { label: 'Assists', value: pitchAssists },
              { label: 'Bonus Points', value: pitchBonus }
            ]}
          />
          <StatusCard
            title="Players Playing"
            value={`${playersPlaying}/11`}
            status="info"
            icon={<Users className="h-4 w-4" />}
            details={[
              { label: 'Started', value: pitchPlayersData?.filter(p => p.starts > 0).length || 0 },
              { label: 'Minutes Played', value: pitchPlayersData?.reduce((sum, p) => sum + (p.minutes || 0), 0) || 0 }
            ]}
          />
          <StatusCard
            title="Average Score"
            value="38"
            status="warning"
            icon={<TrendingUp className="h-4 w-4" />}
            details={[
              { label: 'Top Score', value: currentGameweek?.highest_score || '-' },
              { label: 'Your Rank', value: currentGameweek?.rank || '-' }
            ]}
          />
          <StatusCard
            title="Next Deadline"
            value="2d 4h"
            status="info"
            icon={<Clock className="h-4 w-4" />}
            details={[
              { label: 'Date', value: new Date(currentGameweek?.deadline_time).toLocaleDateString() },
              { label: 'Time', value: new Date(currentGameweek?.deadline_time).toLocaleTimeString() }
            ]}
          />
        </div>
      </div>
    </div>
  );
}