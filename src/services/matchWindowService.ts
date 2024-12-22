import { supabase } from "@/integrations/supabase/client";
import { addHours, subHours, isWithinInterval } from "date-fns";
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export type MatchWindow = {
  start: Date;
  end: Date;
  type: 'pre' | 'live' | 'post';
  activeMatches?: number;
  nextKickoff?: Date | null;
};

export async function detectMatchWindow({ timezone = 'UTC' }: { timezone?: string } = {}): Promise<{
  type: 'pre' | 'live' | 'post' | 'idle';
  start?: Date;
  end?: Date;
  activeMatches?: number;
  nextKickoff?: Date;
  timezone: string;
}> {
  console.log('Detecting match window...');
  
  try {
    // Get current gameweek and check transition status
    const { data: currentEvent } = await supabase
      .from('events')
      .select('*')
      .eq('is_current', true)
      .single();

    if (!currentEvent) {
      console.log('No current gameweek found');
      return { type: 'idle', timezone };
    }

    // Check if we're in a gameweek transition
    if (currentEvent.transition_status === 'in_progress') {
      console.log('Gameweek transition in progress');
      return { type: 'idle', timezone };
    }

    const now = new Date();
    const zonedNow = toZonedTime(now, timezone);

    // Get active matches - fix the query to handle postponed matches correctly
    const { data: activeMatches } = await supabase
      .from('fixtures')
      .select('*')
      .eq('event', currentEvent.id)
      .eq('started', true)
      .eq('finished', false)
      .eq('postponed', false)  // Explicitly exclude postponed matches
      .order('kickoff_time', { ascending: true });

    // Get upcoming matches
    const { data: upcomingMatches } = await supabase
      .from('fixtures')
      .select('kickoff_time')
      .eq('event', currentEvent.id)
      .eq('postponed', false)  // Exclude postponed matches
      .gt('kickoff_time', now.toISOString())
      .order('kickoff_time', { ascending: true })
      .limit(1);

    const nextKickoff = upcomingMatches?.[0]?.kickoff_time ? new Date(upcomingMatches[0].kickoff_time) : null;

    // If we have active matches
    if (activeMatches && activeMatches.length > 0) {
      const firstMatch = new Date(activeMatches[0].kickoff_time);
      const lastMatch = new Date(activeMatches[activeMatches.length - 1].kickoff_time);
      const windowEnd = new Date(lastMatch);
      windowEnd.setHours(windowEnd.getHours() + 2.5); // 2.5 hours after last kickoff for extra time

      return {
        type: 'live',
        start: firstMatch,
        end: windowEnd,
        activeMatches: activeMatches.length,
        nextKickoff,
        timezone
      };
    }

    // Check for pre-match window (2 hours before kickoff)
    if (nextKickoff) {
      const preMatchStart = new Date(nextKickoff);
      preMatchStart.setHours(preMatchStart.getHours() - 2);

      if (now >= preMatchStart && now < nextKickoff) {
        return {
          type: 'pre',
          start: preMatchStart,
          end: nextKickoff,
          activeMatches: 0,
          nextKickoff,
          timezone
        };
      }
    }

    // Check for post-match window (within 3 hours of last finished match)
    const { data: recentMatches } = await supabase
      .from('fixtures')
      .select('kickoff_time')
      .eq('event', currentEvent.id)
      .eq('finished', true)
      .eq('postponed', false)  // Exclude postponed matches
      .order('kickoff_time', { ascending: false })
      .limit(1);

    if (recentMatches?.[0]) {
      const matchEnd = new Date(recentMatches[0].kickoff_time);
      matchEnd.setMinutes(matchEnd.getMinutes() + 115); // 90 mins + potential extra time
      
      const postMatchEnd = new Date(matchEnd);
      postMatchEnd.setHours(postMatchEnd.getHours() + 3);
      
      if (now <= postMatchEnd) {
        return {
          type: 'post',
          start: matchEnd,
          end: postMatchEnd,
          activeMatches: 0,
          nextKickoff,
          timezone
        };
      }
    }

    // No active window
    return { 
      type: 'idle',
      nextKickoff,
      timezone
    };
  } catch (error) {
    console.error('Error detecting match window:', error);
    return { type: 'idle', timezone };
  }
}