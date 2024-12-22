import { supabase } from "@/integrations/supabase/client";
import { addHours, subHours, isWithinInterval } from "date-fns";
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

export interface MatchWindow {
  type: 'pre' | 'live' | 'post' | 'none';
  start: Date | null;
  end: Date | null;
  nextKickoff: Date | null;
  activeMatches: number;
  timezone?: string;
}

export interface MatchWindowOptions {
  timezone?: string;
  preMatchWindow?: number; // minutes before kickoff
  postMatchWindow?: number; // minutes after match end
}

const DEFAULT_OPTIONS: MatchWindowOptions = {
  timezone: 'UTC',
  preMatchWindow: 120, // 2 hours
  postMatchWindow: 60 // 1 hour
};

export async function detectMatchWindow(
  options: MatchWindowOptions = DEFAULT_OPTIONS
): Promise<MatchWindow> {
  console.log('Detecting match window with options:', options);
  const now = new Date();
  const localNow = options.timezone ? 
    utcToZonedTime(now, options.timezone) : 
    now;

  try {
    // Check for active matches
    const { data: activeMatches, error: activeError } = await supabase
      .from('fixtures')
      .select('*')
      .eq('started', true)
      .eq('finished', false);

    if (activeError) {
      console.error('Error fetching active matches:', activeError);
      throw activeError;
    }

    // If we have active matches, we're in a live window
    if (activeMatches && activeMatches.length > 0) {
      console.log(`Found ${activeMatches.length} active matches`);
      const firstMatch = new Date(activeMatches[0].kickoff_time);
      const lastMatch = new Date(activeMatches[activeMatches.length - 1].kickoff_time);
      const windowEnd = addHours(lastMatch, 2);

      return {
        type: 'live',
        start: firstMatch,
        end: windowEnd,
        nextKickoff: null,
        activeMatches: activeMatches.length,
        timezone: options.timezone
      };
    }

    // Check for upcoming matches (pre-match window)
    const { data: upcomingMatches, error: upcomingError } = await supabase
      .from('fixtures')
      .select('kickoff_time')
      .gt('kickoff_time', localNow.toISOString())
      .order('kickoff_time', { ascending: true })
      .limit(1);

    if (upcomingError) {
      console.error('Error fetching upcoming matches:', upcomingError);
      throw upcomingError;
    }

    if (upcomingMatches && upcomingMatches.length > 0) {
      const nextKickoff = options.timezone ?
        utcToZonedTime(new Date(upcomingMatches[0].kickoff_time), options.timezone) :
        new Date(upcomingMatches[0].kickoff_time);
        
      const preMatchStart = subHours(nextKickoff, options.preMatchWindow! / 60);

      if (isWithinInterval(localNow, { start: preMatchStart, end: nextKickoff })) {
        console.log('In pre-match window');
        return {
          type: 'pre',
          start: preMatchStart,
          end: nextKickoff,
          nextKickoff,
          activeMatches: 0,
          timezone: options.timezone
        };
      }
    }

    // Check for recently finished matches (post-match window)
    const { data: recentMatches, error: recentError } = await supabase
      .from('fixtures')
      .select('kickoff_time')
      .eq('finished', true)
      .order('kickoff_time', { ascending: false })
      .limit(1);

    if (recentError) {
      console.error('Error fetching recent matches:', recentError);
      throw recentError;
    }

    if (recentMatches && recentMatches.length > 0) {
      const lastMatchEnd = addHours(
        new Date(recentMatches[0].kickoff_time), 
        2
      );
      const postMatchEnd = addHours(
        lastMatchEnd, 
        options.postMatchWindow! / 60
      );

      if (isWithinInterval(localNow, { start: lastMatchEnd, end: postMatchEnd })) {
        console.log('In post-match window');
        return {
          type: 'post',
          start: lastMatchEnd,
          end: postMatchEnd,
          nextKickoff: upcomingMatches?.[0]?.kickoff_time ? 
            new Date(upcomingMatches[0].kickoff_time) : null,
          activeMatches: 0,
          timezone: options.timezone
        };
      }
    }

    // No active window
    console.log('No active match window');
    return {
      type: 'none',
      start: null,
      end: null,
      nextKickoff: upcomingMatches?.[0]?.kickoff_time ? 
        new Date(upcomingMatches[0].kickoff_time) : null,
      activeMatches: 0,
      timezone: options.timezone
    };
  } catch (error) {
    console.error('Error in detectMatchWindow:', error);
    throw error;
  }
}

// Utility function to validate a match window
export function isValidMatchWindow(window: MatchWindow): boolean {
  if (!window) return false;
  
  // Type validation
  if (!['pre', 'live', 'post', 'none'].includes(window.type)) return false;
  
  // Time validation for windows that should have start/end times
  if (window.type !== 'none') {
    if (!window.start || !window.end) return false;
    if (window.start >= window.end) return false;
  }
  
  return true;
}