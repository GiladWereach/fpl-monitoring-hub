import React from 'react';
import { Check, Clock, Play, OctagonAlert, OctagonX, CircleOff } from 'lucide-react';
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
        .single();
      
      if (error) throw error;
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
    liveData: liveData ? {
      minutes: liveData.minutes,
      fixture_id: liveData.fixture_id
    } : 'No live data'
  });

  const getPlayerStatus = () => {
    // Check player availability from players table
    if (player?.chance_of_playing_this_round === 0) {
      console.log(`Player ${player.web_name} is not available (0% chance)`);
      return {
        icon: OctagonX,
        color: '#EF4444', // red-500
        animate: false,
        label: 'Not Available'
      };
    }

    if (player?.chance_of_playing_this_round !== null && player?.chance_of_playing_this_round < 100) {
      console.log(`Player ${player.web_name} is doubtful (${player.chance_of_playing_this_round}%)`);
      return {
        icon: OctagonAlert,
        color: '#FFB020', // warning yellow
        animate: false,
        label: 'Doubtful'
      };
    }

    // Then check match and performance status
    if (liveData && fixtureStatus) {
      // Player is in an active match
      if (liveData.minutes > 0 && fixtureStatus.started && !fixtureStatus.finished) {
        console.log(`Player ${player.web_name} is in play`);
        return {
          icon: Play,
          color: '#3DFF9A',
          animate: true,
          label: 'In Play'
        };
      }

      // Match is finished and player participated
      if ((fixtureStatus.finished || fixtureStatus.finished_provisional) && liveData.minutes > 0) {
        console.log(`Player ${player.web_name} has finished playing (${liveData.minutes} mins)`);
        return {
          icon: Check,
          color: '#9CA3AF', // gray-400
          animate: false,
          label: 'Finished'
        };
      }

      // Match is finished but player didn't play
      if (fixtureStatus.finished || fixtureStatus.finished_provisional) {
        console.log(`Player ${player.web_name} was unused in the match`);
        return {
          icon: CircleOff,
          color: '#9CA3AF', // gray-400
          animate: false,
          label: 'Unused'
        };
      }
    }

    // Default: Yet to play
    console.log(`Player ${player.web_name} is yet to play`);
    return {
      icon: Clock,
      color: '#60A5FA', // blue-400
      animate: false,
      label: 'Yet to Play'
    };
  };

  const status = getPlayerStatus();
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
