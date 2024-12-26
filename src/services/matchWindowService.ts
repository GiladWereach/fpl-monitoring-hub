import { supabase } from "@/integrations/supabase/client";

export type MatchWindow = {
  type: 'live' | 'pre_match' | 'post_match';
  window_start: string;
  window_end: string;
  is_active: boolean;
  match_count: number;
  next_kickoff: string | null;
};

export async function detectMatchWindow(): Promise<MatchWindow | null> {
  console.log('Detecting match window...');
  
  const { data, error } = await supabase
    .rpc('get_current_match_window');

  if (error) {
    console.error('Error detecting match window:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('No active match window found');
    return null;
  }

  // Determine the window type based on match status
  const windowType = data[0].is_active ? 'live' : 
    (new Date(data[0].window_start) > new Date() ? 'pre_match' : 'post_match');

  return {
    type: windowType,
    window_start: data[0].window_start,
    window_end: data[0].window_end,
    is_active: data[0].is_active,
    match_count: data[0].match_count,
    next_kickoff: data[0].next_kickoff
  };
}