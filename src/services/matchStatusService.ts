import { supabase } from '@/integrations/supabase/client';

export type MatchWindow = {
  start: Date;
  end: Date;
  type: 'pre' | 'live' | 'post';
};

export type MatchStatus = {
  isMatchDay: boolean;
  currentWindow: MatchWindow | null;
  activeMatches: number;
  nextKickoff: Date | null;
  isPreMatch: boolean;
  isPostMatch: boolean;
  deadlineTime: Date | null;
};

export async function getMatchStatus(): Promise<MatchStatus> {
  console.log('Fetching match status...');
  
  const now = new Date();
  
  // Get current gameweek deadline
  const { data: currentGameweek } = await supabase
    .from('events')
    .select('deadline_time')
    .eq('is_current', true)
    .single();

  const deadlineTime = currentGameweek?.deadline_time ? new Date(currentGameweek.deadline_time) : null;
  
  // Get active and upcoming matches
  const { data: matches } = await supabase
    .from('fixtures')
    .select('*')
    .eq('started', true)
    .eq('finished', false)
    .order('kickoff_time', { ascending: true });

  const { data: upcomingMatches } = await supabase
    .from('fixtures')
    .select('kickoff_time')
    .gt('kickoff_time', now.toISOString())
    .order('kickoff_time', { ascending: true })
    .limit(1);

  const nextKickoff = upcomingMatches?.[0]?.kickoff_time ? new Date(upcomingMatches[0].kickoff_time) : null;
  
  // Determine match windows
  let currentWindow: MatchWindow | null = null;
  let isPreMatch = false;
  let isPostMatch = false;

  if (matches && matches.length > 0) {
    // We have active matches
    const firstMatch = new Date(matches[0].kickoff_time);
    const lastMatch = new Date(matches[matches.length - 1].kickoff_time);
    
    // Add 2.5 hours after last kickoff for post-match window
    const windowEnd = new Date(lastMatch);
    windowEnd.setHours(windowEnd.getHours() + 2.5);

    currentWindow = {
      start: firstMatch,
      end: windowEnd,
      type: 'live'
    };
  } else if (nextKickoff) {
    // Check if we're in pre-match window (2 hours before kickoff)
    const preMatchStart = new Date(nextKickoff);
    preMatchStart.setHours(preMatchStart.getHours() - 2);
    
    if (now >= preMatchStart && now < nextKickoff) {
      currentWindow = {
        start: preMatchStart,
        end: nextKickoff,
        type: 'pre'
      };
      isPreMatch = true;
    }
  } else {
    // Check if we're in post-match window (within 3 hours of last finished match)
    const { data: recentMatches } = await supabase
      .from('fixtures')
      .select('kickoff_time')
      .eq('finished', true)
      .order('kickoff_time', { ascending: false })
      .limit(1);

    if (recentMatches?.[0]) {
      const matchEnd = new Date(recentMatches[0].kickoff_time);
      matchEnd.setMinutes(matchEnd.getMinutes() + 115); // 90 mins + extra time
      
      const postMatchEnd = new Date(matchEnd);
      postMatchEnd.setHours(postMatchEnd.getHours() + 3);
      
      if (now <= postMatchEnd) {
        currentWindow = {
          start: matchEnd,
          end: postMatchEnd,
          type: 'post'
        };
        isPostMatch = true;
      }
    }
  }

  return {
    isMatchDay: Boolean(currentWindow),
    currentWindow,
    activeMatches: matches?.length || 0,
    nextKickoff,
    isPreMatch,
    isPostMatch,
    deadlineTime
  };
}

// Utility to check if we're within a specific window
export function isWithinWindow(window: MatchWindow): boolean {
  const now = new Date();
  return now >= window.start && now <= window.end;
}