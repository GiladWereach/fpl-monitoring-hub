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
  // Add detailed logging for Rogers specifically
  if (player?.id === 54) {
    // First, log the raw player data
    console.log('Raw player data for Rogers:', player);
    
    // Then log the specific fields we're interested in
    console.log(`Detailed data for Rogers:`, {
      id: player?.id,
      web_name: player?.web_name,
      raw_chance_of_playing: player?.chance_of_playing_this_round,
      typeof_chance: typeof player?.chance_of_playing_this_round,
      raw_status: player?.status,
      typeof_status: typeof player?.status,
      team_id: player?.team,
      parsed_chance: parseInt(player?.chance_of_playing_this_round),
      is_null: player?.chance_of_playing_this_round === null,
      is_undefined: player?.chance_of_playing_this_round === undefined,
      full_player_object: player // Log the entire player object to see all available data
    });
  }

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

      if (player?.id === 54) {
        console.log('Live performance data for Rogers:', {
          player_id: player.id,
          event_id: currentEvent.id,
          data,
          raw_player_data: player // Log the player data again here to compare
        });
      }

      return data;
    }
  });

  // Query fixture status when we have a fixture_id
  const { data: fixtureStatus } = useQuery({
    queryKey: ['fixture-status', livePerformance?.fixture_id],
    enabled: !!livePerformance?.fixture_id,
    queryFn: async () => {
      if (player?.id === 54) {
        console.log(`Fetching fixture status for Rogers (fixture ${livePerformance.fixture_id})`);
      }
      
      const { data, error } = await supabase
        .from('fixtures')
        .select('started, finished, finished_provisional, kickoff_time')
        .eq('id', livePerformance.fixture_id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching fixture status:', error);
        return null;
      }

      if (player?.id === 54) {
        console.log(`Fixture status for Rogers:`, {
          fixture_id: livePerformance.fixture_id,
          status: data,
          live_data: liveData ? {
            minutes: liveData.minutes,
            points: liveData.total_points,
          } : 'No live data',
          player_status: {
            chance_of_playing: player?.chance_of_playing_this_round,
            status: player?.status,
            raw_player: player // Log the raw player data again for comparison
          }
        });
      }

      return data;
    }
  });

  const isPlayerUnavailable = () => {
    // Player is unavailable if:
    // 1. They have 0% chance of playing OR
    // 2. Their status is 'n' (not available) regardless of chance_of_playing value
    // 3. Their status is undefined/null but chance_of_playing is 0
    const hasZeroChance = player?.chance_of_playing_this_round === 0;
    const isNotAvailable = player?.status === 'n';
    
    if (player?.id === 54) {
      console.log(`Detailed availability check for Rogers:`, {
        hasZeroChance,
        isNotAvailable,
        raw_chance_of_playing: player?.chance_of_playing_this_round,
        parsed_chance: parseInt(player?.chance_of_playing_this_round),
        status: player?.status,
        status_type: typeof player?.status,
        chance_type: typeof player?.chance_of_playing_this_round,
        full_player_data: player // Log the full player data one more time
      });
    }

    return hasZeroChance || isNotAvailable;
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

      if (player?.id === 54) {
        console.log(`Rogers fixture status:`, {
          kickoff_time: kickoffTime,
          current_time: now,
          started: fixtureStatus.started,
          finished: fixtureStatus.finished,
          finished_provisional: fixtureStatus.finished_provisional,
          minutes_played: liveData?.minutes,
          chance_of_playing: player?.chance_of_playing_this_round
        });
      }

      // Match is finished
      if (fixtureStatus.finished_provisional) {
        return getFinishedStatus();
      }

      // Future match
      if (kickoffTime > now && !fixtureStatus.started) {
        // Check for doubtful status for upcoming matches
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
    }

    // Default: no status icon needed
    return null;
  };

  const status = getPlayerStatus();
  if (!status) return null;

  return <StatusIcon status={status} />;
}