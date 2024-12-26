import { supabase } from "@/integrations/supabase/client";

export interface MatchWindow {
  windowStart: Date;
  windowEnd: Date;
  isActive: boolean;
  matchCount: number;
  nextKickoff: Date | null;
}

export async function getCurrentMatchWindow(): Promise<MatchWindow | null> {
  console.log('Detecting current match window...');
  
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
    return {
      windowStart: new Date(currentWindow.window_start),
      windowEnd: new Date(currentWindow.window_end),
      isActive: currentWindow.is_active,
      matchCount: currentWindow.match_count,
      nextKickoff: currentWindow.next_kickoff ? new Date(currentWindow.next_kickoff) : null
    };
  } catch (error) {
    console.error('Failed to get match window:', error);
    throw error;
  }
}

export async function getScheduleInterval(): Promise<number> {
  try {
    const window = await getCurrentMatchWindow();
    
    if (!window) {
      console.log('No match window - using default 30 minute interval');
      return 30; // Default to 30 minutes when no matches
    }

    if (window.isActive) {
      console.log('Active match window - using 2 minute interval');
      return 2; // 2 minute intervals during matches
    }

    if (window.nextKickoff) {
      const minutesToKickoff = Math.floor(
        (window.nextKickoff.getTime() - Date.now()) / (1000 * 60)
      );

      if (minutesToKickoff <= 30) {
        console.log('Approaching kickoff - using 15 minute interval');
        return 15; // 15 minute intervals approaching kickoff
      }
    }

    console.log('Between matches - using 30 minute interval');
    return 30; // Default between matches
  } catch (error) {
    console.error('Error determining schedule interval:', error);
    return 30; // Safe default on error
  }
}