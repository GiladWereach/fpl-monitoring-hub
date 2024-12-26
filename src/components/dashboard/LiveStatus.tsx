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
import { supabase } from '@/integrations/supabase/client';

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
  const { data: matchWindow, isLoading: windowLoading } = useQuery({
    queryKey: ['match-window'],
    queryFn: () => detectMatchWindow(),
    refetchInterval: 30000
  });

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
    if (currentGameweek?.transition_status === 'in_progress') {
      return "warning";
    }

    switch (matchWindow?.type) {
      case 'live':
        return "success";
      case 'pre_match':
        return "warning";
      case 'post_match':
        return "default";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = () => {
    if (currentGameweek?.transition_status === 'in_progress') {
      return "Gameweek Transition";
    }

    switch (matchWindow?.type) {
      case 'live':
        return `Live (${matchWindow.match_count} matches)`;
      case 'pre_match':
        return "Pre-match";
      case 'post_match':
        return "Post-match";
      default:
        if (matchWindow?.next_kickoff) {
          const timeUntil = Math.floor(
            (matchWindow.next_kickoff.getTime() - Date.now()) / (1000 * 60)
          );
          if (timeUntil < 60) return `Next match in ${timeUntil}m`;
          return `Next match in ${Math.floor(timeUntil / 60)}h`;
        }
        return "Idle";
    }
  };

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
      {showWindow && matchWindow?.window_start && matchWindow?.window_end && (
        <span className="text-xs text-muted-foreground">
          ({formatInTimeZone(matchWindow.window_start, timezone, 'HH:mm')} - {
            formatInTimeZone(matchWindow.window_end, timezone, 'HH:mm')
          })
        </span>
      )}
    </div>
  );
};