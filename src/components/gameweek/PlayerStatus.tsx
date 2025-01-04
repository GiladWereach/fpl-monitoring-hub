import React from 'react';
import { Check, Play, XOctagon, AlertCircle, Clock } from 'lucide-react';
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
    chance_of_playing: player?.chance_of_playing_this_round,
    status: player?.status,
    live_data: liveData ? {
      minutes: liveData.minutes,
      points: liveData.total_points,
      fixture_id: fixture_id
    } : 'No live data',
    fixture_id: fixture_id
  });

  // Query live performance data to get fixture_id
  const { data: livePerformance } = useQuery({
    queryKey: ['live-performance', player?.id],
    enabled: !!player?.id,
    queryFn: async () => {
      // Get current event first
      const { data: currentEvent } = await supabase
        .from('events')
        .select('id')
        .eq('is_current', true)
        .single();

      if (!currentEvent) return null;

      // Then get live performance data
      const { data, error } = await supabase
        .from('gameweek_live_performance')
        .select('*')
        .eq('event_id', currentEvent.id)
        .eq('player_id', player.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching live performance:', error);
        return null;
      }

      console.log('Live performance data for player:', {
        player_id: player.id,
        event_id: currentEvent.id,
        data
      });

      return data;
    }
  });

  // Query fixture status when we have a fixture_id
  const { data: fixtureStatus } = useQuery({
    queryKey: ['fixture-status', livePerformance?.fixture_id],
    enabled: !!livePerformance?.fixture_id,
    queryFn: async () => {
      console.log(`Fetching fixture status for player ${player?.web_name} (fixture ${livePerformance.fixture_id})`);
      
      const { data, error } = await supabase
        .from('fixtures')
        .select('started, finished, finished_provisional, kickoff_time')
        .eq('id', livePerformance.fixture_id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching fixture status:', error);
        return null;
      }

      console.log(`Fixture status for ${player?.web_name}:`, {
        fixture_id: livePerformance.fixture_id,
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
    // Check for completely unavailable players (0% chance) first
    // This is the ONLY status that overrides match status
    if (player?.chance_of_playing_this_round === 0) {
      console.log(`${player?.web_name} has 0% chance of playing - showing red octagon regardless of match status`);
      return {
        icon: XOctagon,
        color: '#EF4444', // Red
        animate: false,
        label: 'Not Available'
      };
    }

    // For all other cases, check match status first
    if (fixtureStatus) {
      const kickoffTime = new Date(fixtureStatus.kickoff_time);
      const now = new Date();

      console.log(`${player?.web_name} fixture status:`, {
        kickoff_time: kickoffTime,
        current_time: now,
        started: fixtureStatus.started,
        finished: fixtureStatus.finished,
        finished_provisional: fixtureStatus.finished_provisional,
        minutes_played: liveData?.minutes,
        chance_of_playing: player?.chance_of_playing_this_round
      });

      // Match is finished
      if (fixtureStatus.finished_provisional) {
        return {
          icon: Check,
          color: '#9CA3AF', // Gray
          animate: false,
          label: 'Finished'
        };
      }

      // Future match
      if (kickoffTime > now && !fixtureStatus.started) {
        // Check for doubtful status for upcoming matches
        if (player?.chance_of_playing_this_round !== null && player?.chance_of_playing_this_round < 100) {
          console.log(`${player?.web_name} has ${player.chance_of_playing_this_round}% chance of playing in upcoming match`);
          return {
            icon: AlertCircle,
            color: '#FCD34D', // Yellow
            animate: false,
            label: `${player.chance_of_playing_this_round}% Chance`
          };
        }

        return {
          icon: Clock,
          color: '#3B82F6', // Blue
          animate: false,
          label: 'Upcoming'
        };
      }

      // Match is in progress
      if (fixtureStatus.started && !fixtureStatus.finished && !fixtureStatus.finished_provisional) {
        if (liveData?.minutes > 0) {
          return {
            icon: Play,
            color: '#3DFF9A', // Green
            animate: true,
            label: 'In Play'
          };
        }
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