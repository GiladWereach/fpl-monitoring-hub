import { supabase } from "@/integrations/supabase/client";

export interface MatchWindow {
  type: 'live' | 'pre_match' | 'post_match' | 'idle';
  is_active: boolean;
  window_start: Date;
  window_end: Date;
  match_count: number;
  next_kickoff: Date | null;
  hasActiveMatches: boolean;
  isMatchDay: boolean;
  matchCount?: number;
}

export async function detectMatchWindow(): Promise<MatchWindow | null> {
  console.log('Detecting match window...');
  
  try {
    const { data: currentWindow, error } = await supabase
      .rpc('get_current_match_window');

    if (error) {
      console.error('Error detecting match window:', error);
      throw error;
    }

    if (!currentWindow) {
      console.log('No active match window found');
      return null;
    }

    console.log('Current match window:', currentWindow);
    
    // Determine window type based on match status
    let windowType: 'live' | 'pre_match' | 'post_match' | 'idle' = 'idle';
    if (currentWindow.is_active && currentWindow.match_count > 0) {
      windowType = 'live';
    } else if (currentWindow.next_kickoff && new Date(currentWindow.next_kickoff) > new Date()) {
      windowType = 'pre_match';
    } else if (currentWindow.window_end && new Date() <= new Date(currentWindow.window_end)) {
      windowType = 'post_match';
    }

    return {
      type: windowType,
      is_active: currentWindow.is_active,
      window_start: new Date(currentWindow.window_start),
      window_end: new Date(currentWindow.window_end),
      match_count: currentWindow.match_count,
      next_kickoff: currentWindow.next_kickoff ? new Date(currentWindow.next_kickoff) : null,
      hasActiveMatches: currentWindow.is_active && currentWindow.match_count > 0,
      isMatchDay: currentWindow.is_active || (currentWindow.next_kickoff && 
        ((new Date(currentWindow.next_kickoff).getTime() - new Date().getTime()) <= 2 * 60 * 60 * 1000)),
      matchCount: currentWindow.match_count
    };
  } catch (error) {
    console.error('Failed to get match window:', error);
    throw error;
  }
}