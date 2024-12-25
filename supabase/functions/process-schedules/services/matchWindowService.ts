import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../../shared/logging-service.ts';

export interface MatchWindow {
  type: 'pre' | 'live' | 'post' | 'idle';
  hasActiveMatches: boolean;
  nextMatchTime?: Date;
  timezone?: string;
}

export async function detectMatchWindow(
  supabaseClient: ReturnType<typeof createClient>
): Promise<MatchWindow> {
  logDebug('match-window-service', 'Detecting match window...');
  
  try {
    // Get active matches
    const { data: activeMatches, error: activeError } = await supabaseClient
      .from('fixtures')
      .select('*')
      .eq('started', true)
      .eq('finished', false)
      .order('kickoff_time', { ascending: true });

    if (activeError) {
      logError('match-window-service', 'Error fetching active matches:', activeError);
      throw activeError;
    }

    if (activeMatches && activeMatches.length > 0) {
      logDebug('match-window-service', `Found ${activeMatches.length} active matches`);
      return {
        type: 'live',
        hasActiveMatches: true,
        timezone: 'UTC'
      };
    }

    // Check for upcoming matches in the next hour
    const oneHourFromNow = new Date();
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

    const { data: upcomingMatches, error: upcomingError } = await supabaseClient
      .from('fixtures')
      .select('*')
      .eq('started', false)
      .lte('kickoff_time', oneHourFromNow.toISOString())
      .order('kickoff_time');

    if (upcomingError) {
      logError('match-window-service', 'Error fetching upcoming matches:', upcomingError);
      throw upcomingError;
    }

    if (upcomingMatches?.length) {
      const nextKickoff = new Date(upcomingMatches[0].kickoff_time);
      return {
        type: 'pre',
        hasActiveMatches: false,
        nextMatchTime: nextKickoff,
        timezone: 'UTC'
      };
    }

    // Default to idle state
    return {
      type: 'idle',
      hasActiveMatches: false,
      timezone: 'UTC'
    };
  } catch (error) {
    logError('match-window-service', 'Error in detectMatchWindow:', error);
    throw error;
  }
}