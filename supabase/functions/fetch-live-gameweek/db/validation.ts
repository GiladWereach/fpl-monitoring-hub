import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../logging.ts';

export async function validatePlayers(
  supabaseClient: ReturnType<typeof createClient>, 
  playerIds: number[]
) {
  logDebug('fetch-live-gameweek', `Validating ${playerIds.length} players...`);
  
  const { data: existingPlayers, error } = await supabaseClient
    .from('players')
    .select('id')
    .in('id', playerIds);

  if (error) {
    logError('fetch-live-gameweek', 'Error validating players:', error);
    throw error;
  }

  const validPlayerIds = new Set(existingPlayers.map(p => p.id));
  logDebug('fetch-live-gameweek', `Found ${validPlayerIds.size} valid players out of ${playerIds.length}`);
  
  return validPlayerIds;
}

export async function validateGameweek(
  supabaseClient: ReturnType<typeof createClient>, 
  eventId: number
): Promise<boolean> {
  try {
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select('deadline_time, finished')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError) throw eventError;
    if (!event) return false;

    const now = new Date();
    const deadlineTime = new Date(event.deadline_time);
    
    // If the gameweek is finished or we're before the deadline, don't process
    if (event.finished || now < deadlineTime) {
      return false;
    }

    return true;
  } catch (error) {
    logError('fetch-live-gameweek', 'Error validating gameweek:', error);
    return false;
  }
}