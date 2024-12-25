import { supabase } from "@/integrations/supabase/client";
import { addHours, subHours } from "date-fns";
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export interface MatchWindow {
  start: Date;
  end: Date;
  type: 'pre' | 'live' | 'post' | 'idle';
  hasActiveMatches: boolean;
  activeMatches?: number;
  nextKickoff?: Date;
  timezone?: string;
}

export interface MatchWindowOptions {
  timezone?: string;
}

export async function detectMatchWindow({ timezone = 'UTC' }: MatchWindowOptions = {}): Promise<MatchWindow> {
  console.log('Detecting match window...');
  
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);
  
  // Get active matches
  const { data: activeMatches } = await supabase
    .from('fixtures')
    .select('*')
    .eq('started', true)
    .eq('finished', false)
    .order('kickoff_time', { ascending: true });

  if (activeMatches && activeMatches.length > 0) {
    console.log(`Found ${activeMatches.length} active matches`);
    const firstMatch = new Date(activeMatches[0].kickoff_time);
    const lastMatch = new Date(activeMatches[activeMatches.length - 1].kickoff_time);
    const windowEnd = addHours(lastMatch, 2.5); // 2.5 hours after last kickoff

    return {
      start: firstMatch,
      end: windowEnd,
      type: 'live',
      hasActiveMatches: true,
      activeMatches: activeMatches.length,
      timezone
    };
  }

  // Check for upcoming matches
  const { data: upcomingMatches } = await supabase
    .from('fixtures')
    .select('kickoff_time')
    .gt('kickoff_time', now.toISOString())
    .order('kickoff_time')
    .limit(1);

  if (upcomingMatches?.length) {
    const nextKickoff = new Date(upcomingMatches[0].kickoff_time);
    const preMatchWindow = subHours(nextKickoff, 2);

    if (now >= preMatchWindow && now < nextKickoff) {
      console.log('In pre-match window');
      return {
        start: preMatchWindow,
        end: nextKickoff,
        type: 'pre',
        hasActiveMatches: false,
        nextKickoff,
        timezone
      };
    }

    // Outside pre-match window but have upcoming match
    return {
      start: now,
      end: preMatchWindow,
      type: 'idle',
      hasActiveMatches: false,
      nextKickoff,
      timezone
    };
  }

  // Check if we're in post-match window
  const { data: recentMatches } = await supabase
    .from('fixtures')
    .select('kickoff_time')
    .eq('finished', true)
    .order('kickoff_time', { ascending: false })
    .limit(1);

  if (recentMatches?.length) {
    const lastMatchEnd = addHours(new Date(recentMatches[0].kickoff_time), 2);
    const postMatchEnd = addHours(lastMatchEnd, 3);

    if (now <= postMatchEnd) {
      console.log('In post-match window');
      return {
        start: lastMatchEnd,
        end: postMatchEnd,
        type: 'post',
        hasActiveMatches: false,
        timezone
      };
    }
  }

  // Default idle window
  return {
    start: now,
    end: addHours(now, 24),
    type: 'idle',
    hasActiveMatches: false,
    timezone
  };
}

// Re-export getMatchWindow for backward compatibility
export async function getMatchWindow(): Promise<MatchWindow> {
  return detectMatchWindow();
}