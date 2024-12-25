import { Card } from '@/components/ui/card';
import { Trophy, Users, TrendingUp, Clock } from 'lucide-react';

interface GameweekHeaderProps {
  currentGameweek: any;
  totalPoints: number;
  playersPlaying: number;
}

export function GameweekHeader({ currentGameweek, totalPoints, playersPlaying }: GameweekHeaderProps) {
  return (
    <>
      <div className="relative py-6 text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#3DFF9A] to-[#50E3C2]">
          Gameweek {currentGameweek?.id} Live
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Track your team's performance in real-time with detailed statistics and live updates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <Card className="glass-card p-6">
          <div className="flex items-center space-x-4">
            <Trophy className="h-8 w-8 text-[#3DFF9A]" />
            <div>
              <p className="text-sm text-gray-400">Total Points</p>
              <p className="text-2xl font-bold">{totalPoints}</p>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-6">
          <div className="flex items-center space-x-4">
            <Users className="h-8 w-8 text-[#3DFF9A]" />
            <div>
              <p className="text-sm text-gray-400">Players Playing</p>
              <p className="text-2xl font-bold">{playersPlaying}/11</p>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-6">
          <div className="flex items-center space-x-4">
            <TrendingUp className="h-8 w-8 text-[#3DFF9A]" />
            <div>
              <p className="text-sm text-gray-400">Average Score</p>
              <p className="text-2xl font-bold">38</p>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-6">
          <div className="flex items-center space-x-4">
            <Clock className="h-8 w-8 text-[#3DFF9A]" />
            <div>
              <p className="text-sm text-gray-400">Next Deadline</p>
              <p className="text-2xl font-bold">2d 4h</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}