import { getSupabaseClient } from './client.ts';

export async function getCurrentEvent(supabaseClient: any) {
  console.log('Fetching current event...');
  const { data: currentEvent, error: eventError } = await supabaseClient
    .from('events')
    .select('id, deadline_time, finished')
    .lt('deadline_time', new Date().toISOString())
    .gt('deadline_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('deadline_time', { ascending: false })
    .limit(1)
    .single();

  if (eventError) {
    console.error('Error fetching current event:', eventError);
    throw eventError;
  }
  
  if (!currentEvent) {
    console.log('No current gameweek found within the last 7 days');
    return null;
  }

  console.log('Current event:', currentEvent);
  return currentEvent;
}

export async function getEventDetails(supabaseClient: any, eventId: number) {
  console.log(`Fetching details for event ${eventId}`);
  const { data: event, error } = await supabaseClient
    .from('events')
    .select('deadline_time, finished')
    .eq('id', eventId)
    .single();

  if (error) {
    console.error('Error fetching event details:', error);
    throw error;
  }

  return event;
}