import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { detectMatchWindow } from '@/services/matchWindowService';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LiveStatusProps {
  showLabel?: boolean;
  showWindow?: boolean;
  timezone?: string;
}

export const LiveStatus = ({ 
  showLabel = true, 
  showWindow = false,
  timezone = 'UTC'
}: LiveStatusProps) => {
  // Query for match window
  const { data: matchWindow, isLoading: windowLoading } = useQuery({
    queryKey: ['match-window', timezone],
    queryFn: () => detectMatchWindow({ timezone }),
    refetchInterval: 30000
  });

  // Query for current gameweek status
  const { data: currentGameweek, isLoading: gameweekLoading } = useQuery({
    queryKey: ['current-gameweek'],
    queryFn: async () => {
      console.log('Fetching current gameweek status...');
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_current', true)
        .single();
      
      if (error) throw error;
      console.log('Current gameweek status:', data);
      return data;
    },
    refetchInterval: 60000
  });

  if (windowLoading || gameweekLoading) {
    return <Badge variant="secondary" className="h-2 w-2 rounded-full p-0 animate-pulse" />;
  }

  const getStatusVariant = () => {
    // Check for gameweek transition first
    if (currentGameweek?.transition_status === 'in_progress') {
      return "warning";
    }

    // Then check match window status
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
    // Gameweek transition takes precedence
    if (currentGameweek?.transition_status === 'in_progress') {
      return "Gameweek Transition";
    }

    // Regular match window status
    switch (matchWindow?.type) {
      case 'live':
        return `Live (${matchWindow.activeMatches} matches)`;
      case 'pre':
        return "Pre-match";
      case 'post':
        return "Post-match";
      default:
        if (matchWindow?.nextKickoff) {
          const timeUntil = Math.floor(
            (matchWindow.nextKickoff.getTime() - Date.now()) / (1000 * 60)
          );
          if (timeUntil < 60) return `Next match in ${timeUntil}m`;
          return `Next match in ${Math.floor(timeUntil / 60)}h`;
        }
        return "Idle";
    }
  };

  // Show transition error if exists
  if (currentGameweek?.transition_error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Gameweek transition error: {currentGameweek.transition_error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={getStatusVariant()} 
              className="h-2 w-2 rounded-full p-0" 
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>{getStatusLabel()}</p>
            {currentGameweek?.transition_status === 'in_progress' && (
              <p className="text-xs text-muted-foreground">
                Started at: {format(new Date(currentGameweek.transition_started_at), 'HH:mm:ss')}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {getStatusLabel()}
        </span>
      )}
      {showWindow && matchWindow?.start && matchWindow?.end && (
        <span className="text-xs text-muted-foreground">
          ({formatInTimeZone(matchWindow.start, timezone, 'HH:mm')} - {
            formatInTimeZone(matchWindow.end, timezone, 'HH:mm')
          })
        </span>
      )}
    </div>
  );
};