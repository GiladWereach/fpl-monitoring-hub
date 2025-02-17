import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatusIcon } from './components/StatusIcon';
import {
  getUnavailableStatus,
  getDoubtfulStatus,
  getFinishedStatus,
  getUpcomingStatus,
  getInPlayStatus,
} from './utils/playerStatusUtils';

interface PlayerStatusProps {
  player: any;
  liveData?: any;
  fixture_id?: number;
}

export function PlayerStatus({ player, liveData, fixture_id }: PlayerStatusProps) {
  // Query live performance data to get fixture_id
  const { data: livePerformance } = useQuery({
    queryKey: ['live-performance', player?.id],
    enabled: !!player?.id,
    queryFn: async () => {
      const { data: currentEvent } = await supabase
        .from('events')
        .select('id')
        .eq('is_current', true)
        .single();

      if (!currentEvent) return null;

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

      return data;
    }
  });

  // Query fixture status when we have a fixture_id
  const { data: fixtureStatus } = useQuery({
    queryKey: ['fixture-status', livePerformance?.fixture_id],
    enabled: !!livePerformance?.fixture_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fixtures')
        .select('started, finished, finished_provisional, kickoff_time')
        .eq('id', livePerformance.fixture_id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching fixture status:', error);
        return null;
      }

      return data;
    }
  });

  const isPlayerUnavailable = () => {
    const chanceOfPlaying = player?.chance_of_playing_this_round;
    
    // Log raw data for debugging
    console.log(`Availability check for ${player?.web_name}:`, {
      chance_of_playing_this_round: chanceOfPlaying,
      status: player?.status,
      raw_data: {
        id: player?.id,
        chance: chanceOfPlaying,
        type: typeof chanceOfPlaying,
        raw_player: player
      }
    });

    // Check if player is unavailable (explicitly 0)
    if (chanceOfPlaying === 0 || chanceOfPlaying === "0") {
      console.log(`${player?.web_name} is unavailable due to 0% chance of playing`);
      return true;
    }

    // Check if player status indicates unavailability
    if (player?.status === 'u' || player?.status === 'n') {
      console.log(`${player?.web_name} is unavailable due to status: ${player?.status}`);
      return true;
    }

    return false;
  };

  const getPlayerStatus = () => {
    // ALWAYS check unavailability first - this overrides ALL other statuses
    if (isPlayerUnavailable()) {
      return getUnavailableStatus(player?.web_name);
    }

    // For all other cases, check match status
    if (fixtureStatus) {
      const kickoffTime = new Date(fixtureStatus.kickoff_time);
      const now = new Date();

      console.log(`Match status check for ${player?.web_name}:`, {
        kickoff_time: kickoffTime,
        current_time: now,
        started: fixtureStatus.started,
        finished: fixtureStatus.finished,
        finished_provisional: fixtureStatus.finished_provisional,
        minutes_played: liveData?.minutes,
        chance_of_playing: player?.chance_of_playing_this_round
      });

      // Future match
      if (kickoffTime > now && !fixtureStatus.started) {
        // Check for doubtful status for upcoming matches
        // Only show doubtful if chance is not null and less than 100
        if (player?.chance_of_playing_this_round !== null && 
            player?.chance_of_playing_this_round < 100) {
          return getDoubtfulStatus(player?.web_name, player.chance_of_playing_this_round);
        }
        return getUpcomingStatus();
      }

      // Match is in progress
      if (fixtureStatus.started && !fixtureStatus.finished && !fixtureStatus.finished_provisional) {
        if (liveData?.minutes > 0) {
          return getInPlayStatus();
        }
      }

      // Match is finished - only show if player is available
      if (fixtureStatus.finished_provisional && !isPlayerUnavailable()) {
        return getFinishedStatus();
      }
    }

    // Default: no status icon needed
    return null;
  };

  const status = getPlayerStatus();
  if (!status) return null;

  return <StatusIcon status={status} />;
}