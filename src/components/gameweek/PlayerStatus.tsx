import React from 'react';
import { Check, Play, XOctagon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlayerStatusProps {
  player: any;
  liveData?: any;
  fixture_id?: number;
}

export function PlayerStatus({ player, liveData, fixture_id }: PlayerStatusProps) {
  console.log(`PlayerStatus component for ${player?.web_name}:`, {
    player_id: player?.id,
    live_data: liveData ? {
      minutes: liveData.minutes,
      points: liveData.total_points,
      fixture_id: liveData.fixture_id
    } : 'No live data',
    passed_fixture_id: fixture_id
  });

  // Query fixture status when we have live data
  const { data: fixtureStatus } = useQuery({
    queryKey: ['fixture-status', fixture_id],
    enabled: !!fixture_id,
    queryFn: async () => {
      console.log(`Fetching fixture status for player ${player?.web_name} (fixture ${fixture_id})`);
      
      const { data, error } = await supabase
        .from('fixtures')
        .select('started, finished, finished_provisional')
        .eq('id', fixture_id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching fixture status:', error);
        return null;
      }

      console.log(`Fixture status for ${player?.web_name}:`, {
        fixture_id,
        status: data,
        live_data: liveData ? {
          minutes: liveData.minutes,
          points: liveData.total_points,
        } : 'No live data',
        player_status: {
          chance_of_playing: player?.chance_of_playing_this_round,
          status: player?.status
        }
      });

      return data;
    }
  });

  const getPlayerStatus = () => {
    // Check player availability first
    if (player?.chance_of_playing_this_round === 0) {
      console.log(`${player?.web_name} is not available to play`);
      return {
        icon: XOctagon,
        color: '#EF4444',
        animate: false,
        label: 'Not Available'
      };
    }

    // Then check match and performance status
    if (liveData && fixtureStatus) {
      console.log(`${player?.web_name} match status:`, {
        started: fixtureStatus.started,
        finished: fixtureStatus.finished,
        finished_provisional: fixtureStatus.finished_provisional,
        minutes_played: liveData.minutes
      });

      // Match is in progress
      if (fixtureStatus.started && !fixtureStatus.finished && !fixtureStatus.finished_provisional) {
        return {
          icon: Play,
          color: '#3DFF9A',
          animate: true,
          label: 'In Play'
        };
      }

      // Match is finished and player participated
      if ((fixtureStatus.finished || fixtureStatus.finished_provisional) && liveData.minutes > 0) {
        return {
          icon: Check,
          color: '#9CA3AF',
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