import { SupabaseClient } from '@supabase/supabase-js';
import { MatchWindow } from './types/processor-types';
import { logDebug, logError } from '../../../shared/logging-service';

export async function detectMatchWindow(
  client: SupabaseClient
): Promise<MatchWindow> {
  logDebug('match-window-service', 'Detecting match window...');
  
  try {
    const { data: activeMatches, error: activeError } = await client
      .from('fixtures')
      .select('*')
      .eq('started', true)
      .eq('finished', false);

    if (activeError) throw activeError;

    if (activeMatches && activeMatches.length > 0) {
      logDebug('match-window-service', `Found ${activeMatches.length} active matches`);
      return {
        hasActiveMatches: true,
        isMatchDay: true
      };
    }

    // Check for upcoming matches in next 2 hours
    const twoHoursFromNow = new Date();
    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);

    const { data: upcomingMatches, error: upcomingError } = await client
      .from('fixtures')
      .select('*')
      .eq('started', false)
      .lte('kickoff_time', twoHoursFromNow.toISOString());

    if (upcomingError) throw upcomingError;

    return {
      hasActiveMatches: false,
      isMatchDay: upcomingMatches && upcomingMatches.length > 0,
      nextMatchTime: upcomingMatches?.[0]?.kickoff_time ? new Date(upcomingMatches[0].kickoff_time) : undefined
    };
  } catch (error) {
    logError('match-window-service', 'Error detecting match window:', error);
    throw error;
  }
}