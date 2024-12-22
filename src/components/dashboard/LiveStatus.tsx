import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { detectMatchWindow } from '@/services/matchWindowService';
import { format } from 'date-fns';

interface LiveStatusProps {
  showLabel?: boolean;
  showWindow?: boolean;
}

export const LiveStatus = ({ showLabel = true, showWindow = false }: LiveStatusProps) => {
  const { data: matchWindow, isLoading } = useQuery({
    queryKey: ['match-window'],
    queryFn: detectMatchWindow,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return <Badge variant="secondary" className="h-2 w-2 rounded-full p-0 animate-pulse" />;
  }

  const getStatusVariant = () => {
    switch (matchWindow?.type) {
      case 'live':
        return "success";
      case 'pre':
        return "warning";
      case 'post':
        return "default";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = () => {
    switch (matchWindow?.type) {
      case 'live':
        return `Live (${matchWindow.activeMatches} matches)`;
      case 'pre':
        return "Pre-match";
      case 'post':
        return "Post-match";
      default:
        if (matchWindow?.nextKickoff) {
          const timeUntil = Math.floor((matchWindow.nextKickoff.getTime() - Date.now()) / (1000 * 60));
          if (timeUntil < 60) return `Next match in ${timeUntil}m`;
          return `Next match in ${Math.floor(timeUntil / 60)}h`;
        }
        return "Idle";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={getStatusVariant()} 
        className="h-2 w-2 rounded-full p-0" 
      />
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {getStatusLabel()}
        </span>
      )}
      {showWindow && matchWindow?.start && matchWindow?.end && (
        <span className="text-xs text-muted-foreground">
          ({format(matchWindow.start, 'HH:mm')} - {format(matchWindow.end, 'HH:mm')})
        </span>
      )}
    </div>
  );
};