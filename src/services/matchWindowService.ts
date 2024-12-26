import { supabase } from "@/integrations/supabase/client";

export type MatchWindowType = 'live' | 'pre_match' | 'post_match' | 'idle';

export interface MatchWindow {
  type: MatchWindowType;
  window_start: Date;
  window_end: Date;
  is_active: boolean;
  match_count: number;
  next_kickoff: Date | null;
}

export interface MatchWindowOptions {
  timezone?: string;
}

export async function detectMatchWindow(options: MatchWindowOptions = {}): Promise<MatchWindow> {
  console.log('Detecting match window...', options);
  
  try {
    const { data, error } = await supabase
      .rpc('get_current_match_window');

    if (error) {
      console.error('Error detecting match window:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('No active match window found');
      return {
        type: 'idle',
        window_start: new Date(),
        window_end: new Date(),
        is_active: false,
        match_count: 0,
        next_kickoff: null
      };
    }

    const window = data[0];
    console.log('Match window data:', window);

    // Determine window type
    let type: MatchWindowType = 'idle';
    if (window.is_active && window.match_count > 0) {
      type = 'live';
    } else if (window.next_kickoff && new Date(window.next_kickoff) > new Date()) {
      type = 'pre_match';
    } else if (window.match_count === 0) {
      type = 'post_match';
    }

    return {
      type,
      window_start: new Date(window.window_start),
      window_end: new Date(window.window_end),
      is_active: window.is_active,
      match_count: window.match_count,
      next_kickoff: window.next_kickoff ? new Date(window.next_kickoff) : null
    };
  } catch (error) {
    console.error('Error in detectMatchWindow:', error);
    throw error;
  }
}