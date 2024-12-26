import { supabase } from "@/integrations/supabase/client";

export interface MatchWindow {
  hasActiveMatches: boolean;
  isMatchDay: boolean;
  nextMatchTime?: Date;
  matchCount: number;
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

    console.log('Match window status:', {
      activeMatches: activeMatches?.length || 0,
      upcomingMatches: upcomingMatches?.length || 0,
      nextMatch: nextMatch?.kickoff_time
    });

    return {
      hasActiveMatches,
      isMatchDay: (activeMatches?.length || 0) + (upcomingMatches?.length || 0) > 0,
      nextMatchTime: nextMatch ? new Date(nextMatch.kickoff_time) : undefined,
      matchCount: activeMatches?.length || 0
    };
  } catch (error) {
    console.error('Error detecting match window:', error);
    throw error;
  }
}