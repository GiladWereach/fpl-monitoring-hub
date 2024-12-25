import { supabase } from "@/integrations/supabase/client";

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

    // Get active matches with detailed status
    const { data: activeMatches } = await supabase
      .from('fixtures')
      .select(`
        *,
        team_h:teams!fk_fixtures_team_h(name),
        team_a:teams!fk_fixtures_team_a(name)
      `)
      .eq('started', true)
      .eq('finished', false)
      .eq('postponed', false)
      .order('kickoff_time', { ascending: true });

    // Check for matches in extra time
    const matchesInExtraTime = activeMatches?.filter(match => match.minutes > 90) || [];
    if (matchesInExtraTime.length > 0) {
      console.log(`${matchesInExtraTime.length} matches in extra time`);
    }

    // Check for abandoned matches
    const { data: abandonedMatches } = await supabase
      .from('fixtures')
      .select('*')
      .eq('started', true)
      .eq('finished', false)
      .gt('minutes', 0)
      .eq('postponed', true);

    if (abandonedMatches?.length) {
      console.log(`${abandonedMatches.length} abandoned matches found`);
    }

    // Get upcoming matches
    const { data: upcomingMatches } = await supabase
      .from('fixtures')
      .select('kickoff_time')
      .eq('event', currentEvent.id)
      .eq('postponed', false)
      .gt('kickoff_time', now.toISOString())
      .order('kickoff_time', { ascending: true })
      .limit(1);

    const nextKickoff = upcomingMatches?.[0]?.kickoff_time ? new Date(upcomingMatches[0].kickoff_time) : null;

    // If we have active matches
    if (activeMatches && activeMatches.length > 0) {
      const firstMatch = new Date(activeMatches[0].kickoff_time);
      const lastMatch = new Date(activeMatches[activeMatches.length - 1].kickoff_time);
      
      // Add extra buffer for matches in extra time
      const extraTimeBuffer = matchesInExtraTime.length > 0 ? 0.5 : 0; // 30 minutes extra
      const windowEnd = new Date(lastMatch);
      windowEnd.setHours(windowEnd.getHours() + 2.5 + extraTimeBuffer);

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
      .select('kickoff_time, minutes')
      .eq('event', currentEvent.id)
      .eq('finished', true)
      .eq('postponed', false)
      .order('kickoff_time', { ascending: false })
      .limit(1);

    if (recentMatches?.[0]) {
      const matchEnd = new Date(recentMatches[0].kickoff_time);
      // Add actual match duration instead of fixed 90 minutes
      const matchDuration = Math.max(90, recentMatches[0].minutes || 90);
      matchEnd.setMinutes(matchEnd.getMinutes() + matchDuration + 5); // +5 for stoppage time
      
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