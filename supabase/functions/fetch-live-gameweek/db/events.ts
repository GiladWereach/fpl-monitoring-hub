import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../logging.ts';

export async function getCurrentEvent(supabaseClient: ReturnType<typeof createClient>) {
  logDebug('fetch-live-gameweek', 'Fetching current event...');
  
  const { data: currentEvent, error: eventError } = await supabaseClient
    .from('events')
    .select('id, deadline_time, finished')
    .lt('deadline_time', new Date().toISOString())
    .gt('deadline_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('deadline_time', { ascending: false })
    .limit(1)
    .single();

  if (eventError) {
    logError('fetch-live-gameweek', 'Error fetching current event:', eventError);
    throw eventError;
  }
  
  if (!currentEvent) {
    logDebug('fetch-live-gameweek', 'No current gameweek found');
    return null;
  }

  logDebug('fetch-live-gameweek', 'Current event:', currentEvent);
  return currentEvent;
}