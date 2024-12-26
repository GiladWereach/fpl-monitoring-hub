import { supabase } from "@/integrations/supabase/client";

export interface MatchWindow {
  type: 'live' | 'pre_match' | 'post_match' | 'idle';
  is_active: boolean;
  window_start: Date;
  window_end: Date;
  match_count: number;
  next_kickoff: Date | null;
  matchCount?: number; // For backward compatibility
  hasActiveMatches: boolean;
  isMatchDay: boolean;
  nextMatchTime?: Date;
}

export async function detectMatchWindow(): Promise<MatchWindow | null> {
  console.log('Detecting match window...');
  
  try {
    // Get current event
    const { data: currentEvent } = await supabase
      .from('events')
      .select('*')
      .eq('is_current', true)
      .single();

    if (!currentEvent) {
      console.log('No current event found');
      return null;
    }

    // Check for active matches
    const { data: activeMatches, error: activeError } = await supabase
      .from('fixtures')
      .select('*')
      .eq('event', currentEvent.id)
      .eq('started', true)
      .eq('finished', false);

    if (activeError) throw activeError;

    // Get upcoming matches for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: upcomingMatches, error: upcomingError } = await supabase
      .from('fixtures')
      .select('*')
      .eq('event', currentEvent.id)
      .gte('kickoff_time', today.toISOString())
      .lt('kickoff_time', tomorrow.toISOString())
      .order('kickoff_time');

    if (upcomingError) throw upcomingError;

    const hasActiveMatches = activeMatches && activeMatches.length > 0;
    const nextMatch = upcomingMatches?.find(m => !m.started);
    const matchCount = activeMatches?.length || 0;

    // Calculate window boundaries
    const windowStart = hasActiveMatches ? new Date(activeMatches[0].kickoff_time) : null;
    const lastActiveMatch = activeMatches?.[activeMatches.length - 1];
    const windowEnd = lastActiveMatch ? new Date(new Date(lastActiveMatch.kickoff_time).getTime() + 2.5 * 60 * 60 * 1000) : null;

    console.log('Match window status:', {
      activeMatches: matchCount,
      upcomingMatches: upcomingMatches?.length || 0,
      nextMatch: nextMatch?.kickoff_time
    });

    const nextKickoff = nextMatch ? new Date(nextMatch.kickoff_time) : null;
    const isMatchDay = hasActiveMatches || (nextKickoff && 
      ((nextKickoff.getTime() - new Date().getTime()) <= 2 * 60 * 60 * 1000));

    let type: 'live' | 'pre_match' | 'post_match' | 'idle' = 'idle';
    if (hasActiveMatches) {
      type = 'live';
    } else if (nextKickoff && new Date() <= nextKickoff) {
      type = 'pre_match';
    } else if (windowEnd && new Date() <= windowEnd) {
      type = 'post_match';
    }

    return {
      type,
      is_active: hasActiveMatches,
      window_start: windowStart || new Date(),
      window_end: windowEnd || new Date(),
      match_count: matchCount,
      next_kickoff: nextKickoff,
      matchCount,
      hasActiveMatches,
      isMatchDay,
      nextMatchTime: nextKickoff
    };
  } catch (error) {
    console.error('Error detecting match window:', error);
    throw error;
  }
}