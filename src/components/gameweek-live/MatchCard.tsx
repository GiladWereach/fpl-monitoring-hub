import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { MatchStatus } from '@/components/dashboard/services/matchStatusService';
import { getMatchStatusInfo } from './utils/matchStatusUtils';

interface MatchCardProps {
  match: any;
  matchStatus: MatchStatus | undefined;
  isSelected: boolean;
  onSelect: (matchId: number) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ 
  match, 
  matchStatus, 
  isSelected, 
  onSelect 
}) => {
  const { status, color, reason } = getMatchStatusInfo(match, matchStatus);
  
  return (
    <Card 
      className={`p-4 relative cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onSelect(match.id)}
    >
      <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${color}`} />
      
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {format(new Date(match.kickoff_time), 'MMM d, HH:mm')}
          </span>
          <Badge variant={status === 'POSTPONED' ? 'destructive' : 'outline'}>
            {status}
          </Badge>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex-1">
            <p className="font-semibold">{match.team_h.name}</p>
          </div>
          <div className="px-4 text-xl font-bold">
            {match.started && !match.postponed ? 
              `${match.team_h_score ?? 0} - ${match.team_a_score ?? 0}` : 
              'vs'
            }
          </div>
          <div className="flex-1 text-right">
            <p className="font-semibold">{match.team_a.name}</p>
          </div>
        </div>

        {match.started && !match.finished_provisional && !match.postponed && (
          <div className="text-center text-sm text-gray-500">
            {match.minutes > 90 ? `${match.minutes}' (ET)` : `${match.minutes}'`}
          </div>
        )}

        {match.postponed && reason && (
          <div className="text-center text-sm text-red-500 mt-2">
            {reason}
          </div>
        )}
      </div>
    </Card>
  );
};