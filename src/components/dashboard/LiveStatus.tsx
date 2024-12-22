import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { getMatchStatus } from '@/services/matchStatusService';

interface LiveStatusProps {
  showLabel?: boolean;
  showWindow?: boolean;
}

export const LiveStatus = ({ showLabel = true, showWindow = false }: LiveStatusProps) => {
  const { data: status, isLoading } = useQuery({
    queryKey: ['match-status'],
    queryFn: getMatchStatus,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return <Badge variant="secondary" className="h-2 w-2 rounded-full p-0 animate-pulse" />;
  }

  const getStatusVariant = () => {
    if (status?.activeMatches > 0) return "success";
    if (status?.isPreMatch) return "warning";
    if (status?.isPostMatch) return "default";
    return "secondary";
  };

  const getStatusLabel = () => {
    if (status?.activeMatches > 0) return `Live (${status.activeMatches} matches)`;
    if (status?.isPreMatch) return "Pre-match";
    if (status?.isPostMatch) return "Post-match";
    if (status?.nextKickoff) {
      const timeUntil = Math.floor((status.nextKickoff.getTime() - Date.now()) / (1000 * 60));
      if (timeUntil < 60) return `Next match in ${timeUntil}m`;
      return `Next match in ${Math.floor(timeUntil / 60)}h`;
    }
    return "Idle";
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
      {showWindow && status?.currentWindow && (
        <span className="text-xs text-muted-foreground">
          ({new Date(status.currentWindow.start).toLocaleTimeString()} - {new Date(status.currentWindow.end).toLocaleTimeString()})
        </span>
      )}
    </div>
  );
};