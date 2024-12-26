import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../logging.ts';

export async function getCurrentEvent(
  supabaseClient: ReturnType<typeof createClient>
): Promise<{ id: number } | null> {
  try {
    const { data: currentEvent, error: currentError } = await supabaseClient
      .from('events')
      .select('*')
      .eq('is_current', true)
      .single();

    if (currentError) throw currentError;
    
    if (!currentEvent) {
      logDebug('events', 'No current gameweek found');
      return null;
    }

    return currentEvent;
  } catch (error) {
    logError('events', 'Error fetching current event:', error);
    throw error;
  }
}

export async function checkGameweekTransition(
  supabaseClient: ReturnType<typeof createClient>
): Promise<boolean> {
  try {
    const { data: currentEvent, error: currentError } = await supabaseClient
      .from('events')
      .select('*')
      .eq('is_current', true)
      .single();

    if (currentError) throw currentError;
    
    if (!currentEvent) {
      logDebug('events', 'No current gameweek found');
      return false;
    }

    // Check if all fixtures are finished
    const { data: fixtures, error: fixturesError } = await supabaseClient
      .from('fixtures')
      .select('finished, finished_provisional')
      .eq('event', currentEvent.id);

    if (fixturesError) throw fixturesError;

    const allFinished = fixtures?.every(f => f.finished && f.finished_provisional);
    
    if (allFinished) {
      logDebug('events', 'All fixtures finished, checking next gameweek');
      
      // Get next gameweek
      const { data: nextEvent } = await supabaseClient
        .from('events')
        .select('*')
        .gt('id', currentEvent.id)
        .order('id', { ascending: true })
        .limit(1)
        .single();

      if (nextEvent) {
        const now = new Date();
        const deadlineTime = new Date(nextEvent.deadline_time);
        
        // If we're within 2 hours of next gameweek's deadline
        if (now >= new Date(deadlineTime.getTime() - 2 * 60 * 60 * 1000)) {
          logDebug('events', `Transitioning to gameweek ${nextEvent.id}`);
          
          // Update gameweek status
          await supabaseClient
            .from('events')
            .update({ 
              is_current: false,
              transition_status: 'completed',
              transition_completed_at: new Date().toISOString()
            })
            .eq('id', currentEvent.id);
            
          await supabaseClient
            .from('events')
            .update({ 
              is_current: true,
              transition_status: 'in_progress',
              transition_started_at: new Date().toISOString()
            })
            .eq('id', nextEvent.id);
          
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    logError('events', 'Error checking gameweek transition:', error);
    return false;
  }
}