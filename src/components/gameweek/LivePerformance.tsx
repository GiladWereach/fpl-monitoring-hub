import { Card } from '@/components/ui/card';

interface LivePerformanceProps {
  totalPoints: number;
  benchPoints: number;
  liveData: any[];
}

export function LivePerformance({ totalPoints, benchPoints, liveData }: LivePerformanceProps) {
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
            <span className="font-medium">
              {liveData?.reduce((sum, p) => sum + (p.goals_scored || 0), 0) || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Assists</span>
            <span className="font-medium">
              {liveData?.reduce((sum, p) => sum + (p.assists || 0), 0) || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Bonus Points</span>
            <span className="font-medium">
              {liveData?.reduce((sum, p) => sum + (p.bonus || 0), 0) || 0}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}