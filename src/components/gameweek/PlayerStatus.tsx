import React from 'react';
import { Check, Play, XOctagon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlayerStatusProps {
  player: any;
  liveData?: any;
}

export function PlayerStatus({ player, liveData }: PlayerStatusProps) {
  // Query fixture status when we have live data
  const { data: fixtureStatus } = useQuery({
    queryKey: ['fixture-status', liveData?.fixture_id],
    enabled: !!liveData?.fixture_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fixtures')
        .select('started, finished, finished_provisional')
        .eq('id', liveData.fixture_id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching fixture status:', error);
        return null;
      }

      console.log('Fixture status for fixture', liveData.fixture_id, ':', data);
      return data;
    }
  });

  console.log('Player Status Check:', {
    player_id: player?.id,
    web_name: player?.web_name,
    chance_of_playing: player?.chance_of_playing_this_round,
    status: player?.status,
    fixture_status: fixtureStatus,
    live_data: liveData ? {
      minutes: liveData.minutes,
      fixture_id: liveData.fixture_id
    } : 'No live data'
  });

  const getPlayerStatus = () => {
    // Check player availability first
    if (player?.chance_of_playing_this_round === 0) {
      console.log(`Player ${player.web_name} is not available (0% chance)`);
      return {
        icon: XOctagon,
        color: '#EF4444', // red-500
        animate: false,
        label: 'Not Available'
      };
    }

    // Then check match and performance status
    if (liveData && fixtureStatus) {
      // Match is in progress
      if (fixtureStatus.started && !fixtureStatus.finished && !fixtureStatus.finished_provisional) {
        console.log(`Player ${player.web_name} is in play`);
        return {
          icon: Play,
          color: '#3DFF9A', // green
          animate: true,
          label: 'In Play'
        };
      }

      // Match is finished and player participated
      if ((fixtureStatus.finished || fixtureStatus.finished_provisional) && liveData.minutes > 0) {
        console.log(`Player ${player.web_name} has finished playing`);
        return {
          icon: Check,
          color: '#9CA3AF', // gray-400
          animate: false,
          label: 'Finished'
        };
      }
    }

    // Default: no status icon needed
    return null;
  };

  const status = getPlayerStatus();
  if (!status) return null;

  const Icon = status.icon;

  return (
    <div className="absolute bottom-1 left-1">
      <Icon 
        className={cn(
          "h-4 w-4",
          status.animate && "animate-pulse"
        )}
        color={status.color}
        aria-label={status.label}
      />
    </div>
  );
}