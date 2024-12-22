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
    .maybeSingle();

  if (eventError) {
    logError('fetch-live-gameweek', 'Error fetching current event:', eventError);
    throw eventError;
  }
  
  if (!currentEvent) {
    logDebug('fetch-live-gameweek', 'No current gameweek found within the last 7 days');
    throw new Error('No current gameweek found');
  }

  logDebug('fetch-live-gameweek', 'Current event:', currentEvent);
  return currentEvent;
}

export async function getNextEvent(supabaseClient: ReturnType<typeof createClient>, currentEventId: number) {
  logDebug('fetch-live-gameweek', `Fetching next event after ${currentEventId}...`);
  
  const { data: nextEvent, error } = await supabaseClient
    .from('events')
    .select('id, deadline_time')
    .gt('id', currentEventId)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    logError('fetch-live-gameweek', 'Error fetching next event:', error);
    throw error;
  }

  return nextEvent;
}

export async function checkGameweekTransition(supabaseClient: ReturnType<typeof createClient>) {
  const currentEvent = await getCurrentEvent(supabaseClient);
  
  // If current gameweek is finished, check for next gameweek
  if (currentEvent.finished) {
    const nextEvent = await getNextEvent(supabaseClient, currentEvent.id);
    
    if (nextEvent) {
      const now = new Date();
      const deadlineTime = new Date(nextEvent.deadline_time);
      
      // If we're within 2 hours of next gameweek's deadline
      if (now >= new Date(deadlineTime.getTime() - 2 * 60 * 60 * 1000)) {
        // Update current gameweek
        await supabaseClient
          .from('events')
          .update({ is_current: false })
          .eq('id', currentEvent.id);
          
        await supabaseClient
          .from('events')
          .update({ is_current: true })
          .eq('id', nextEvent.id);
          
        logDebug('fetch-live-gameweek', `Transitioned to gameweek ${nextEvent.id}`);
        return nextEvent;
      }
    }
  }
  
  return currentEvent;
}