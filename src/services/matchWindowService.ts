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

interface MatchWindowResponse {
  window_start: string;
  window_end: string;
  is_active: boolean;
  match_count: number;
  next_kickoff: string | null;
}

export async function detectMatchWindow(): Promise<MatchWindow | null> {
  console.log('Detecting match window...');
  
  try {
    const { data: currentWindow, error } = await supabase
      .rpc('get_current_match_window')
      .single();

    if (error) {
      console.error('Error detecting match window:', error);
      throw error;
    }

    if (!currentWindow) {
      console.log('No active match window found');
      return null;
    }

    console.log('Current match window:', currentWindow);
    const response = currentWindow as MatchWindowResponse;
    
    // Determine window type based on match status
    let windowType: 'live' | 'pre_match' | 'post_match' | 'idle' = 'idle';
    if (response.is_active && response.match_count > 0) {
      windowType = 'live';
    } else if (response.next_kickoff && new Date(response.next_kickoff) > new Date()) {
      windowType = 'pre_match';
    } else if (response.window_end && new Date() <= new Date(response.window_end)) {
      windowType = 'post_match';
    }

    // Transform the response into our MatchWindow type
    const matchWindow: MatchWindow = {
      type: windowType,
      is_active: response.is_active,
      window_start: new Date(response.window_start),
      window_end: new Date(response.window_end),
      match_count: response.match_count,
      next_kickoff: response.next_kickoff ? new Date(response.next_kickoff) : null,
      hasActiveMatches: response.is_active && response.match_count > 0,
      isMatchDay: response.is_active || (response.next_kickoff && 
        ((new Date(response.next_kickoff).getTime() - new Date().getTime()) <= 2 * 60 * 60 * 1000)),
      matchCount: response.match_count
    };

    return matchWindow;
  } catch (error) {
    console.error('Failed to get match window:', error);
    throw error;
  }
}