import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from './logging-service.ts';

export interface MatchWindow {
  windowStart: Date;
  windowEnd: Date;
  isActive: boolean;
  matchCount: number;
  nextKickoff: Date | null;
}

export async function detectMatchWindow(
  supabaseClient: ReturnType<typeof createClient>
): Promise<MatchWindow | null> {
  try {
    const { data: currentWindow, error } = await supabaseClient
      .rpc('get_current_match_window');

    if (error) {
      logError('match-window-service', 'Error detecting match window:', error);
      throw error;
    }

    if (!currentWindow) {
      logDebug('match-window-service', 'No active match window found');
      return null;
    }

    logDebug('match-window-service', 'Current match window:', currentWindow);
    return {
      windowStart: new Date(currentWindow.window_start),
      windowEnd: new Date(currentWindow.window_end),
      isActive: currentWindow.is_active,
      matchCount: currentWindow.match_count,
      nextKickoff: currentWindow.next_kickoff ? new Date(currentWindow.next_kickoff) : null
    };
  } catch (error) {
    logError('match-window-service', 'Failed to get match window:', error);
    throw error;
  }
}