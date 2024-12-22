import { supabase } from "@/integrations/supabase/client";
import { addHours, subHours, isWithinInterval } from "date-fns";

export interface MatchWindow {
  type: 'pre' | 'live' | 'post' | 'none';
  start: Date | null;
  end: Date | null;
  nextKickoff: Date | null;
  activeMatches: number;
}

export async function detectMatchWindow(): Promise<MatchWindow> {
  console.log('Detecting match window...');
  const now = new Date();

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
      const windowEnd = addHours(lastMatch, 2); // 2 hours after last kickoff

      return {
        type: 'live',
        start: firstMatch,
        end: windowEnd,
        nextKickoff: null,
        activeMatches: activeMatches.length
      };
    }

    // Check for upcoming matches (pre-match window)
    const { data: upcomingMatches, error: upcomingError } = await supabase
      .from('fixtures')
      .select('kickoff_time')
      .gt('kickoff_time', now.toISOString())
      .order('kickoff_time', { ascending: true })
      .limit(1);

    if (upcomingError) {
      console.error('Error fetching upcoming matches:', upcomingError);
      throw upcomingError;
    }

    if (upcomingMatches && upcomingMatches.length > 0) {
      const nextKickoff = new Date(upcomingMatches[0].kickoff_time);
      const preMatchStart = subHours(nextKickoff, 3); // 3 hours before kickoff

      if (isWithinInterval(now, { start: preMatchStart, end: nextKickoff })) {
        console.log('In pre-match window');
        return {
          type: 'pre',
          start: preMatchStart,
          end: nextKickoff,
          nextKickoff,
          activeMatches: 0
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
      const lastMatchEnd = addHours(new Date(recentMatches[0].kickoff_time), 2); // Approximate match end
      const postMatchEnd = addHours(lastMatchEnd, 1); // 1 hour post-match window

      if (isWithinInterval(now, { start: lastMatchEnd, end: postMatchEnd })) {
        console.log('In post-match window');
        return {
          type: 'post',
          start: lastMatchEnd,
          end: postMatchEnd,
          nextKickoff: upcomingMatches?.[0]?.kickoff_time ? new Date(upcomingMatches[0].kickoff_time) : null,
          activeMatches: 0
        };
      }
    }

    // No active window
    console.log('No active match window');
    return {
      type: 'none',
      start: null,
      end: null,
      nextKickoff: upcomingMatches?.[0]?.kickoff_time ? new Date(upcomingMatches[0].kickoff_time) : null,
      activeMatches: 0
    };
  } catch (error) {
    console.error('Error in detectMatchWindow:', error);
    throw error;
  }
}